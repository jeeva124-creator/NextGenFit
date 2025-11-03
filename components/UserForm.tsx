"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserData } from "@/types";
import { motion } from "framer-motion";
import { 
  User, 
  Cake, 
  Users, 
  Ruler, 
  Weight, 
  Target, 
  Zap, 
  MapPin, 
  UtensilsCrossed, 
  Info,
  ChevronDown
} from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(13).max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(300),
  fitnessGoal: z.enum([
    "Weight Loss",
    "Muscle Gain",
    "Endurance",
    "General Fitness",
    "Athletic Performance",
  ]),
  fitnessLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  workoutLocation: z.enum(["Home", "Gym", "Outdoor"]),
  dietaryPreferences: z.enum(["Veg", "Non-Veg", "Vegan", "Keto"]),
  medicalHistory: z.string().optional(),
  stressLevel: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UserFormProps {
  onSubmit: (data: UserData) => void;
  isLoading?: boolean;
}

export function UserForm({ onSubmit, isLoading }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: "Female",
      fitnessGoal: "Weight Loss",
      fitnessLevel: "Beginner",
      workoutLocation: "Home",
      dietaryPreferences: "Veg",
    },
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as UserData);
  };

  const FormField = ({ 
    label, 
    icon: Icon, 
    error, 
    children 
  }: { 
    label: string; 
    icon: any; 
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <div className="pl-10">
          {children}
        </div>
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  );

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-purple-400" />
        Your Details
      </h2>

      <FormField label="Name" icon={User} error={errors.name?.message}>
        <input
          {...register("name")}
          type="text"
          className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Jane Doe"
        />
      </FormField>

      <FormField label="Age" icon={Cake} error={errors.age?.message}>
        <input
          {...register("age", { valueAsNumber: true })}
          type="number"
          className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="30"
        />
      </FormField>

      <FormField label="Gender" icon={Users} error={errors.gender?.message}>
        <div className="relative">
          <select
            {...register("gender")}
            className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </FormField>

      <FormField label="Height (cm)" icon={Ruler} error={errors.height?.message}>
        <input
          {...register("height", { valueAsNumber: true })}
          type="number"
          className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="165"
        />
      </FormField>

      <FormField label="Weight (kg)" icon={Weight} error={errors.weight?.message}>
        <input
          {...register("weight", { valueAsNumber: true })}
          type="number"
          className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="70"
        />
      </FormField>

      <FormField label="Fitness Goal" icon={Target} error={errors.fitnessGoal?.message}>
        <div className="relative">
          <select
            {...register("fitnessGoal")}
            className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          >
            <option value="Weight Loss">Weight Loss</option>
            <option value="Muscle Gain">Muscle Gain</option>
            <option value="Endurance">Endurance</option>
            <option value="General Fitness">General Fitness</option>
            <option value="Athletic Performance">Athletic Performance</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </FormField>

      <FormField label="Current Fitness Level" icon={Zap} error={errors.fitnessLevel?.message}>
        <div className="relative">
          <select
            {...register("fitnessLevel")}
            className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </FormField>

      <FormField label="Workout Location" icon={MapPin} error={errors.workoutLocation?.message}>
        <div className="relative">
          <select
            {...register("workoutLocation")}
            className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          >
            <option value="Home">Home (Basic Equipment)</option>
            <option value="Gym">Gym</option>
            <option value="Outdoor">Outdoor</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </FormField>

      <FormField label="Dietary Preference" icon={UtensilsCrossed} error={errors.dietaryPreferences?.message}>
        <div className="relative">
          <select
            {...register("dietaryPreferences")}
            className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          >
            <option value="Veg">Vegetarian</option>
            <option value="Non-Veg">Non-Vegetarian</option>
            <option value="Vegan">Vegan</option>
            <option value="Keto">Keto</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </FormField>

      <FormField label="Medical History (Optional)" icon={Info} error={errors.medicalHistory?.message}>
        <input
          {...register("medicalHistory")}
          type="text"
          className="w-full px-4 py-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="None"
        />
      </FormField>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
      >
        {isLoading ? "Generating Plan..." : "Generate My Fitness Plan"}
      </button>
    </motion.form>
  );
}
