/**
 * Lightweight Pure JavaScript EXIF & GPS Metadata Parser
 * Extracts latitude, longitude, altitude, and timestamp directly from uploaded photos
 * (Supports Android GPS Camera apps, iOS geotagged photos, and standard EXIF tags)
 */

export function extractExifGpsData(file) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      return resolve({ hasGeoTag: false, error: 'Not an image file' });
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const view = new DataView(buffer);

        // Check for JPEG SOI marker (0xFFD8)
        if (view.getUint16(0, false) !== 0xffd8) {
          return resolve({ hasGeoTag: false, note: 'Non-JPEG format' });
        }

        const length = view.byteLength;
        let offset = 2;

        while (offset < length) {
          // Check for marker
          if (view.getUint8(offset) !== 0xff) {
            break;
          }

          const marker = view.getUint8(offset + 1);

          // APP1 Marker for EXIF is 0xFFE1
          if (marker === 0xe1) {
            const exifData = parseApp1Exif(view, offset + 4);
            return resolve(exifData);
          }

          // Advance to next marker
          offset += 2 + view.getUint16(offset + 2, false);
        }

        resolve({ hasGeoTag: false, note: 'No EXIF metadata block found' });
      } catch (err) {
        console.warn('[EXIF Parser]', err);
        resolve({ hasGeoTag: false, error: err.message });
      }
    };

    reader.onerror = () => resolve({ hasGeoTag: false, error: 'File read error' });

    // Read first 128KB of image where EXIF header is stored
    const slice = file.slice(0, 131072);
    reader.readAsArrayBuffer(slice);
  });
}

function parseApp1Exif(view, startOffset) {
  // Check 'Exif\0\0' header (0x457869660000)
  const exifHeader =
    String.fromCharCode(view.getUint8(startOffset)) +
    String.fromCharCode(view.getUint8(startOffset + 1)) +
    String.fromCharCode(view.getUint8(startOffset + 2)) +
    String.fromCharCode(view.getUint8(startOffset + 3));

  if (exifHeader !== 'Exif') {
    return { hasGeoTag: false, note: 'Invalid Exif signature' };
  }

  const tiffOffset = startOffset + 6;
  const isLittleEndian = view.getUint16(tiffOffset, false) === 0x4949; // 'II' or 'MM'

  // Read offset to 0th IFD
  const ifd0Offset = tiffOffset + view.getUint32(tiffOffset + 4, isLittleEndian);
  const numEntries = view.getUint16(ifd0Offset, isLittleEndian);

  let gpsIfdOffset = null;
  let make = '';
  let model = '';
  let software = '';

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifd0Offset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, isLittleEndian);

    if (tag === 0x8825) {
      // GPS IFD Pointer Tag
      gpsIfdOffset = tiffOffset + view.getUint32(entryOffset + 8, isLittleEndian);
    } else if (tag === 0x010f) {
      // Make
      make = readAscii(view, tiffOffset, entryOffset, isLittleEndian);
    } else if (tag === 0x0110) {
      // Model
      model = readAscii(view, tiffOffset, entryOffset, isLittleEndian);
    } else if (tag === 0x0131) {
      // Software (e.g., GPS Map Camera)
      software = readAscii(view, tiffOffset, entryOffset, isLittleEndian);
    }
  }

  if (!gpsIfdOffset) {
    return {
      hasGeoTag: false,
      make,
      model,
      software,
      note: 'No GPS IFD tag found in EXIF',
    };
  }

  // Parse GPS IFD
  const numGpsEntries = view.getUint16(gpsIfdOffset, isLittleEndian);
  let latRef = 'N';
  let lonRef = 'E';
  let latValues = null;
  let lonValues = null;
  let altitude = null;
  let gpsDateStamp = null;

  for (let i = 0; i < numGpsEntries; i++) {
    const entryOffset = gpsIfdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, isLittleEndian);

    if (tag === 0x0001) {
      // GPSLatitudeRef
      latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 0x0002) {
      // GPSLatitude (Degrees, Minutes, Seconds)
      latValues = readRationals(view, tiffOffset, entryOffset, 3, isLittleEndian);
    } else if (tag === 0x0003) {
      // GPSLongitudeRef
      lonRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 0x0004) {
      // GPSLongitude (Degrees, Minutes, Seconds)
      lonValues = readRationals(view, tiffOffset, entryOffset, 3, isLittleEndian);
    } else if (tag === 0x0006) {
      // GPSAltitude
      const altRat = readRationals(view, tiffOffset, entryOffset, 1, isLittleEndian);
      if (altRat && altRat.length > 0) altitude = altRat[0];
    } else if (tag === 0x001d) {
      // GPSDateStamp
      gpsDateStamp = readAscii(view, tiffOffset, entryOffset, isLittleEndian);
    }
  }

  if (latValues && lonValues) {
    let lat = latValues[0] + latValues[1] / 60 + latValues[2] / 3600;
    let lon = lonValues[0] + lonValues[1] / 60 + lonValues[2] / 3600;

    if (latRef === 'S') lat = -lat;
    if (lonRef === 'W') lon = -lon;

    return {
      hasGeoTag: true,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lon.toFixed(6)),
      altitude: altitude ? parseFloat(altitude.toFixed(1)) : null,
      gpsDateStamp,
      make,
      model,
      software: software || 'GPS Camera / Mobile Geotag',
      isCameraGpsVerified: true,
    };
  }

  return {
    hasGeoTag: false,
    make,
    model,
    software,
    note: 'Incomplete GPS coordinates in EXIF',
  };
}

function readRationals(view, tiffOffset, entryOffset, count, isLittleEndian) {
  const valueOffset = tiffOffset + view.getUint32(entryOffset + 8, isLittleEndian);
  const rationals = [];
  for (let i = 0; i < count; i++) {
    const num = view.getUint32(valueOffset + i * 8, isLittleEndian);
    const den = view.getUint32(valueOffset + i * 8 + 4, isLittleEndian);
    rationals.push(den === 0 ? 0 : num / den);
  }
  return rationals;
}

function readAscii(view, tiffOffset, entryOffset, isLittleEndian) {
  const count = view.getUint32(entryOffset + 4, isLittleEndian);
  let strOffset = entryOffset + 8;
  if (count > 4) {
    strOffset = tiffOffset + view.getUint32(entryOffset + 8, isLittleEndian);
  }
  let str = '';
  for (let i = 0; i < Math.min(count - 1, 64); i++) {
    const charCode = view.getUint8(strOffset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}
