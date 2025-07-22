import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { UserProfileController } from '../controllers/userProfile.controller';

const router = Router();
const userProfileController = new UserProfileController();

// Profile routes
router.get('/', authenticateToken, userProfileController.getUserProfile);
router.put('/', authenticateToken, userProfileController.updateUserProfile);

// Education routes
router.post('/education', authenticateToken, userProfileController.addEducation);
router.put('/education/:id', authenticateToken, userProfileController.updateEducation);
router.delete('/education/:id', authenticateToken, userProfileController.deleteEducation);

// Experience routes
router.post('/experience', authenticateToken, userProfileController.addExperience);
router.put('/experience/:id', authenticateToken, userProfileController.updateExperience);
router.delete('/experience/:id', authenticateToken, userProfileController.deleteExperience);

// Course routes
router.post('/course', authenticateToken, userProfileController.addCourse);
router.put('/course/:id', authenticateToken, userProfileController.updateCourse);
router.delete('/course/:id', authenticateToken, userProfileController.deleteCourse);

// Certificate routes
router.post('/certificate', authenticateToken, userProfileController.addCertificate);
router.put('/certificate/:id', authenticateToken, userProfileController.updateCertificate);
router.delete('/certificate/:id', authenticateToken, userProfileController.deleteCertificate);

// Hobby routes
router.post('/hobby', authenticateToken, userProfileController.addHobby);
router.put('/hobby/:id', authenticateToken, userProfileController.updateHobby);
router.delete('/hobby/:id', authenticateToken, userProfileController.deleteHobby);

// Skill routes
router.post('/skill', authenticateToken, userProfileController.addSkill);
router.put('/skill/:id', authenticateToken, userProfileController.updateSkill);
router.delete('/skill/:id', authenticateToken, userProfileController.deleteSkill);

export default router;