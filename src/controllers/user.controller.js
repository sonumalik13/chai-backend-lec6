import { asyncHandler } from "../utils/asyncHandler.js/";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

// access and refresh token ek sath generate karna ho ek method bana lete easily access kar lete hai.

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave :false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    /*
    res.status(200).json({
        message:"Post Man Done"

    }) 
    */
    // ye post man me array ke form
    // const allFiles = [
    // ...(req.files?.avatar || []),
    // ...(req.files?.coverImage || [])
    // ];

    // get user details from frontend
    // validation - not empty
    // check if user already exists: from username,email
    // check for images,check for avatar
    // uplaod them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response


    const { username, fullName, email, password } = req.body
    //form or json se aaye to req.body milta hai,url se bhiaasakta 
    console.log("email: ", email);
    console.log("FullName: ", fullName);
    console.log("username: ", username);
    console.log("password is: ", password);

    // if(fullName === ""){
    //     throw new ApiError (400,"Full Name is Required");
    // }   // single check its good idea

    if (
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All Fields Are Required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]  //two or more value check exist
    })

    if (existedUser) {
        throw new ApiError(409, "User With email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // Cover Image Upload Nahi Karna ho To Uke Liye
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {   //localpathavatar nhi return
        throw new ApiError(400, "Avatar file is required")
    }
    console.log("req.files:", req.files);
    // console.log("req.body:", req.body);
    // console.log("avatarLocalPath:", avatarLocalPath); //ye batayega ki image kha hai
    // console.log("Cover image local path:", coverImageLocalPath);
    

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log("Avatar uploaded URL:", avatar?.secure_url);
    // console.log("Cover Image uploaded URL:", coverImage?.secure_url);


    if (!avatar) {
        throw new ApiError(400, "Avatar file IDs required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ) //jo apko nahi chahiye
    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
        //    {     
        //     message: "Files received successfully!",
        //     files: allFiles
        //     },
    )

})

const loginUser = asyncHandler(async (req,res) =>{
    // req body->
    //user or email
    // find the user
    // password check
    // generate access and refreshtoken send the user
    // send cookie then send response login succesfully

    const {email,username,password} = req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }
    // its alternative
    // if(!(username || email)){
    //     throw new ApiError(400,"username or email is required")
    // }


    // User.findOne({email}) //iys use for single

    const user = await User.findOne({
        $or :[{email},{username}]
    })
    // find data in database
    if(!user){
        throw new ApiError (404,"User does not exist") //404 Not Found → Resource nahi mila.
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError (401,"Invalid user credentials") //401 Unauthorized → Authentication (login) chahiye.
    }
    const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookies
    const options = {
        httpsOnly :true,
        secure:true
    } //ye sirf server se modified hogi

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user: loggedInUser,accessToken,refreshToken,
            },
            "user logged In Succesfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res)=>{
    // clear all cookies
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpsOnly :true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {} , "User loggedOut"))
})

const refreshAccessToken = asyncHandler(async(req,res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized requiest")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }
        if(!incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
        const {accessToken, newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
    
        return res 
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(
            new ApiResponse(
                2000,
                {accessToken,refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.User?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(200, req.user, " currrent user fetched successfully ")
})

const updateAccountDetails = asyncHandler(async(res,req)=>{

    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        }
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user,"Account details update successfully"))

})

const updateUserAvatar = asyncHandler(async(res,req)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatart file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error While Uploading on avatar")
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new : true},
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "avatarImage updated successfully   ")
    )
})

const updateUserCoverImage = asyncHandler(async(res,req)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error While Uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new : true},
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "coverImage updated successfully   ")
    )
})








export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}