import { Request, Response, NextFunction } from 'express';
import { findPracticeById, updatePracticeSettings, updatePracticeLogo, getPracticeStaff, getPracticeSubscription } from '../services/practice.service';
import { getPracticeStatistics } from '../services/practice-statistics.service';
import AppError from '../utils/appError';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Type declarations to extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        practiceId: string;
        role: string;
      };
    }
  }
}

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Set up file filter to only accept image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and SVG images are allowed.'));
  }
};

// Configure upload middleware
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * Get practice details
 */
export const getPracticeDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return next(new AppError('Not authorized to access practice details', 403));
    }
    
    const practice = await findPracticeById(practiceId);
    
    if (!practice) {
      return next(new AppError('Practice not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: practice
    });
  } catch (error) {
    console.error('Error fetching practice details:', error);
    next(new AppError('Failed to retrieve practice details', 500));
  }
};

/**
 * Update practice settings
 */
export const updatePractice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return next(new AppError('Not authorized to update practice settings', 403));
    }
    
    const { name, address, phone, email, customBranding } = req.body;
    
    // Only allow certain fields to be updated
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (customBranding !== undefined) updateData.customBranding = customBranding;
    
    const updatedPractice = await updatePracticeSettings(practiceId, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedPractice
    });
  } catch (error) {
    console.error('Error updating practice settings:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to update practice settings', 500));
    }
  }
};

/**
 * Upload practice logo
 */
export const uploadLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return next(new AppError('Not authorized to update practice logo', 403));
    }
    
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }
    
    // Get file path and convert to URL format
    const logoRelativePath = path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/');
    const logoUrl = `${process.env.SERVER_URL || ''}/${logoRelativePath}`;
    
    // Update practice logo in database
    const updatedPractice = await updatePracticeLogo(practiceId, logoUrl);
    
    res.status(200).json({
      success: true,
      data: {
        logo: updatedPractice.logo
      }
    });
  } catch (error) {
    console.error('Error uploading practice logo:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to update practice logo', 500));
    }
  }
};

/**
 * Get practice dashboard statistics
 */
export const getDashboardStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return next(new AppError('Not authorized to access practice statistics', 403));
    }
    
    const statistics = await getPracticeStatistics(practiceId);
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching practice statistics:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to retrieve practice statistics', 500));
    }
  }
};

/**
 * Get practice staff members
 */
export const getStaffMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return next(new AppError('Not authorized to access staff information', 403));
    }
    
    const staff = await getPracticeStaff(practiceId);
    
    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching practice staff:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to retrieve practice staff', 500));
    }
  }
};

/**
 * Get practice subscription information
 */
export const getSubscriptionInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return next(new AppError('Not authorized to access subscription information', 403));
    }
    
    const subscription = await getPracticeSubscription(practiceId);
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to retrieve subscription information', 500));
    }
  }
}; 