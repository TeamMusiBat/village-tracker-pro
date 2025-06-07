import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { 
  insertUserSchema, 
  insertAwarenessSessionSchema, 
  insertAttendeeSchema,
  insertChildScreeningSchema,
  insertScreenedChildSchema,
  insertBlogSchema
} from "@shared/schema";

/**
 * Creates a middleware function that validates the request body against the provided Zod schema
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
function createValidator(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body against schema
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        // Validation failed
        const formattedErrors = result.error.format();
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: formattedErrors 
        });
      }
      
      // Validation succeeded, continue
      next();
    } catch (error) {
      console.error("Validation error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

// User validator with extended schema (for additional checks)
export const validateUser = createValidator(insertUserSchema.extend({
  // Add additional validation rules
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").nullable().optional(),
  phoneNumber: z.string().regex(/^(\+)[0-9]{11,15}$/, "Invalid phone number format. Should start with + followed by 11-15 digits").nullable().optional()
}));

// Awareness session validator with extended schema for coordinates
export const validateAwarenessSession = createValidator(insertAwarenessSessionSchema.extend({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional()
}));

// Attendee validator
export const validateAttendee = createValidator(insertAttendeeSchema);

// Child screening validator with extended schema for coordinates
export const validateChildScreening = createValidator(insertChildScreeningSchema.extend({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional()
}));

// Screened child validator
export const validateScreenedChild = createValidator(insertScreenedChildSchema);

// Blog validator with extended schema
export const validateBlog = createValidator(insertBlogSchema.extend({
  // Add additional validation rules
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  content: z.string().min(20, "Content must be at least 20 characters"),
  imageUrl: z.string().url("Invalid image URL format").nullable().optional()
}));