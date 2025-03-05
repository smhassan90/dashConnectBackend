import { v4 as uuidv4 } from 'uuid';
export const generateOtp = () =>{
    const otp = uuidv4().slice(0, 6);
    return otp
}