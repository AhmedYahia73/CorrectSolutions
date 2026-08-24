import { Router } from "express";
import adminRoute from "./admins";
const route = Router(); 
route.use("/admin", adminRoute); 
export default route;
