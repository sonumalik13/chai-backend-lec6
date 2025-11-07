import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const normalizedPath = localFilePath.replace(/\\/g, "/");
    
        //upload the file on cloudinary 
        const response = await cloudinary.uploader.upload(normalizedPath, {
            resource_type: "auto"
        });
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary", response.url);
        // console.log("Check All Response",response);

        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        // fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload operation got failed

        console.error("❌ Cloudinary upload failed:", error.message);
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return null;
    }
}

export { uploadOnCloudinary }
