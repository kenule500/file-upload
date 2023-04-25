const path = require("path");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const uploadProductImageLocal = async (req, res) => {
  const productImages = req.files?.image;
  const uploadPath = path.join(__dirname, "../public/uploads/");
  const timestamp = Date.now();
  let imagePath = null;

  if (!productImages) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "No image uploaded",
    });
  }

  if (Array.isArray(productImages)) {
    // Move each file to the uploads directory
    const moveFiles = productImages.map(async (productImage) => {
      if (!productImage.mimetype.startsWith("image")) {
        throw new CustomError.BadRequestError("Please upload an image");
      }
      const maxSize = 1024 * 1024;
      if (productImage.size > maxSize) {
        throw new CustomError.BadRequestError(
          "Please upload image smaller 1MB"
        );
      }
      imagePath = path.join(uploadPath, `${timestamp}-${productImage.name}`);
      await productImage.mv(imagePath);
    });
    await Promise.all(moveFiles);
  }

  // Move a file to the uploads directory
  if (!Array.isArray(productImages)) {
    if (!productImages.mimetype.startsWith("image")) {
      throw new CustomError.BadRequestError("Please upload an image");
    }
    const maxSize = 1024 * 1024;
    if (productImages.size > maxSize) {
      throw new CustomError.BadRequestError("Please upload image smaller 1MB");
    }
    imagePath = path.join(uploadPath, `${timestamp}-${productImages.name}`);
    await productImages.mv(imagePath);
  }

  res.status(StatusCodes.OK).json({ image: imagePath });
};

const uploadProductImage = async (req, res) => {
  const productImages = req.files?.image;
  let result = [];

  if (!Array.isArray(productImages)) {
    const image = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: "express",
      }
    );
    result.push(image.secure_url);
    fs.unlinkSync(productImages.tempFilePath);
  }
  if (Array.isArray(productImages)) {
    for (const image of productImages) {
      const uploadedImage = await cloudinary.uploader.upload(
        image.tempFilePath,
        {
          use_filename: true,
          folder: "express",
        }
      );
      result.push(uploadedImage.secure_url);
      fs.unlinkSync(image.tempFilePath);
    }
  }
  res.status(StatusCodes.OK).json({ images: result });
};
module.exports = {
  uploadProductImageLocal,
  uploadProductImage,
};
