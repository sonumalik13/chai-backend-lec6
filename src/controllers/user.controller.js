import { asyncHandler } from "../utils/asyncHandler.js/";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res)=>{
    /*
    res.status(200).json({
        message:"Post Man Done"

    }) 
    */

    // get user details from frontend
    // validation - not empty
    // check if user already exists: from username,email
    // check for images,check for avatar
    // uplaod them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response


    const { username,fullName,email,password } = req.body 
     //form or json se aaye to req.body milta hai,url se bhiaasakta 
    console.log("email: ", email);
    console.log("FullName: ", fullName);
    console.log("username: ", username);
    console.log("password is: ", password);

    // if(fullName === ""){
    //     throw new ApiError (400,"Full Name is Required");
    // }   // single check its good idea

    if(
        [fullName,username,email,password].some(() => field?.trim()=== "")
    ) {
        throw new ApiError(400,"All Fields Are Required")
    }

    const existedUser = User.findOne({
        $or:[{ username },{ email }]  //two or more value check exist
    })

    if(existedUser) {
        throw new ApiError(409, "User With email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {   //localpathavatar nhi return
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400,"Avatar file id required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ) //jo apko nahi chahiye
    if(!createdUser) {
        throw new ApiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json (
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )

} )


export {registerUser}