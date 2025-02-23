import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import  { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken= async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken= user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

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
    // console.log("Email: "+email+" username: "+username);
    // console.log(req.body);
    
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

    const existedUser=await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with same email or username exists");
    }
    // console.log(req.files);

    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is Required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar?.url){
        throw new ApiError("Avatar is Required");
    }

    const user=await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
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

const loginUser= asyncHandler(async (req, res)=>{
    // take the user details from the Frontend
    // Determine all the required fields are filled ( we are making the email base and username base both )
    // check whether the user exists or not
    // check the password
    // access and refresh token
    // send the cookie 

    const {email, username, password}= req.body;

    if(!(email || username)) {
        throw new ApiError(400, "Username or password is required.");
    }

    const user=await User.findOne({
        $or: [{username}, {email}]
    });

    if(!user){
        throw new ApiError(400, "User does not exists")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials");
    }

    const {accessToken, refreshToken}= await generateAccessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    // Cookies can be modified by anyone by default, after these below 2 lines
    const options={
        httpOnly: true,
        secure: true,
    }
    // This cookies becomes midifyable only by the servers.

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser=asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    // Cookies can be modified by anyone by default, after these below 2 lines
    const options={
        httpOnly: true,
        secure: true,
    }
    // This cookies becomes midifyable only by the servers.

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User Logged Out"))

})

const refreshAccessToken=asyncHandler(async(req, res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Unauthorized request")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options={
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken}= await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})



export {registerUser, loginUser, logoutUser, refreshAccessToken}
