import ServiceArea from '../models/ServiceArea.js';
import Department from '../models/Department.js';
import IssueCategory from '../models/IssueCategory.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

/**
 * Get all active Service Areas
 * GET /api/service-areas
 */
export const getServiceAreas = async (req, res, next) => {
  try {
    const areas = await ServiceArea.find({ isActive: true }).sort({ name: 1 });
    return successResponse(res, 'Service areas retrieved successfully', areas);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new Service Area (Super Admin only)
 * POST /api/service-areas
 */
export const createServiceArea = async (req, res, next) => {
  try {
    const { name, code, city, state, pincodes, coordinates, description } = req.body;

    if (!name || !code) {
      return next(new AppError('Name and code are required for a service area', 400));
    }

    const serviceArea = new ServiceArea({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      city: city || 'Hyderabad',
      state: state || 'Telangana',
      pincodes: pincodes || [],
      centerLocation: {
        type: 'Point',
        coordinates: coordinates || [78.3967, 17.4849],
      },
      description: description || '',
    });

    await serviceArea.save();
    return successResponse(res, 'Service area created successfully', serviceArea, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active Departments
 * GET /api/departments
 */
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    return successResponse(res, 'Departments retrieved successfully', departments);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new Department (Super Admin only)
 * POST /api/departments
 */
export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, contactEmail, contactPhone, defaultSlaHours } = req.body;

    if (!name || !code) {
      return next(new AppError('Name and code are required for a department', 400));
    }

    const department = new Department({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      defaultSlaHours: defaultSlaHours || 48,
    });

    await department.save();
    return successResponse(res, 'Department created successfully', department, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active Issue Categories populated with Department info
 * GET /api/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await IssueCategory.find({ isActive: true })
      .populate('defaultDepartment', 'name code defaultSlaHours')
      .sort({ name: 1 });

    return successResponse(res, 'Issue categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new Issue Category (Super Admin only)
 * POST /api/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const {
      name,
      code,
      description,
      defaultDepartment,
      defaultPriority,
      estimatedSlaHours,
      requiresProofImage,
      icon,
    } = req.body;

    if (!name || !code || !defaultDepartment) {
      return next(
        new AppError('Name, code, and defaultDepartment are required', 400)
      );
    }

    const category = new IssueCategory({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || '',
      defaultDepartment,
      defaultPriority: defaultPriority || 'medium',
      estimatedSlaHours: estimatedSlaHours || 48,
      requiresProofImage: requiresProofImage !== false,
      icon: icon || 'alert-circle',
    });

    await category.save();
    return successResponse(res, 'Issue category created successfully', category, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get complete consolidated system configuration
 * GET /api/config/summary
 */
export const getConfigSummary = async (req, res, next) => {
  try {
    const [serviceAreas, departments, categories] = await Promise.all([
      ServiceArea.find({ isActive: true }).sort({ name: 1 }),
      Department.find({ isActive: true }).sort({ name: 1 }),
      IssueCategory.find({ isActive: true })
        .populate('defaultDepartment', 'name code defaultSlaHours')
        .sort({ name: 1 }),
    ]);

    return successResponse(res, 'Consolidated system configuration retrieved', {
      serviceAreasCount: serviceAreas.length,
      departmentsCount: departments.length,
      categoriesCount: categories.length,
      serviceAreas,
      departments,
      categories,
    });
  } catch (error) {
    next(error);
  }
};
