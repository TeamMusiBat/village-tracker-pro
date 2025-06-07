import { storage } from "../storage";
import { InsertUser } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function initializeDefaultData() {
  try {
    // Check if developer exists
    const developer = await storage.getUserByUsername('asifjamali83');
    if (developer) {
      console.log('Developer account already exists');
      return; // Developer already exists
    }
  
    // Create developer account specifically requested by user
    console.log('Creating developer account for asifjamali83');
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash("Atifkhan83##", 10);
    
    await storage.createUser({
      username: "asifjamali83",
      password: hashedPassword,
      name: "Asif Jamali", // Name field is required in schema
      role: "developer",
      email: ""
    });
    
    console.log("Default developer account created successfully");
  } catch (error) {
    console.error("Error initializing default data:", error);
    // Don't throw the error - just log it and continue
    // This allows the server to start even if we can't create the developer account
  }
}