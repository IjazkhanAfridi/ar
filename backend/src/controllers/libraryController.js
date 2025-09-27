import { experienceService } from '../services/experienceService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

class LibraryController {
  /**
   * Get models library - return array directly like working version
   */
  getModelsLibrary = asyncHandler(async (req, res) => {
    const models = await experienceService.getModelsLibrary();
    res.json(models); // Return array directly, not wrapped
  });

  /**
   * Get images library - return array directly like working version
   */
  getImagesLibrary = asyncHandler(async (req, res) => {
    const images = await experienceService.getImagesLibrary();
    res.json(images); // Return array directly, not wrapped
  });

  /**
   * Get videos library - return array directly like working version
   */
  getVideosLibrary = asyncHandler(async (req, res) => {
    const videos = await experienceService.getVideosLibrary();
    res.json(videos); // Return array directly, not wrapped
  });

  /**
   * Get audio library - return array directly like working version
   */
  getAudioLibrary = asyncHandler(async (req, res) => {
    const audios = await experienceService.getAudioLibrary();
    res.json(audios); // Return array directly, not wrapped
  });
}

export const libraryController = new LibraryController();
