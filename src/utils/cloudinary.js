import {v2 as cloudinary} from "cloudinary";
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary=async(localFilePath)=>{
    try{
        if(!localFilePath) return null;

        // upload the file on the cloudinary
        const response= await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("File uploaded Successfully on cloudinary", response.url);
        // console.log(response);
        fs.unlinkSync(localFilePath);
        return response;
    } catch(err){
        fs.unlink(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export { uploadOnCloudinary }
