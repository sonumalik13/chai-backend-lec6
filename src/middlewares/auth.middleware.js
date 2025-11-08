import { ApiError } from "../utils/ApiError.js";
import { asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req, _, next ) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") 
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
       const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
       if(!user){
        // Todo:disscuss about frontend
        throw new ApiError(401,"Incalid Access Token")
       }
    
       req.user = user;
       next()
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token")
    }

    console.log("Token from cookie:", req.cookies?.accessToken);
    console.log("Token from header:", req.header("Authorization"));

})