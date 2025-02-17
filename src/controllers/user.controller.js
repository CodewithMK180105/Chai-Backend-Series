import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import  { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser=asyncHandler(async(req, res, next)=>{

    // Algorithm:

    // get user details from Frontend
    // validation-make sure required fields are not empty
    // Check if the user already exists- username, email
    // check for images check for the avatar
    // upload them to cloudinary- avatar
    // create user object- create entry in db
    // remove password and refresh token field from response
    // check for the user creation
    // return res

    // If the data is coming from the Form or the Json Object. We get that in req.body
    const {fullName, username, email, password}= req.body;
    console.log("Email: "+email+" username: "+username);
    
    if(
        [fullName, username, email, password].some((data)=>data?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required");
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    const existedUser=User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with same email or username exists");
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError("Avatar is Required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(avatar){
        throw new ApiError("Avatar is Required");
    }

    const user=await User.create({
        fullName,
        avatar: avatar.url,
        converImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong, while registering the User")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
    
})

export {registerUser}
