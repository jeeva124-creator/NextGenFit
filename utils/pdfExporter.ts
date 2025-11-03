import jsPDF from "jspdf";
import { GeneratedPlan } from "@/types";

export function exportPlanToPDF(plan: GeneratedPlan): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Personalized Fitness Plan", pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 15;

  // User Details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("User Details", margin, yPosition);
  yPosition += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const userDetails = [
    `Name: ${plan.userData.name}`,
    `Age: ${plan.userData.age}`,
    `Gender: ${plan.userData.gender}`,
    `Height: ${plan.userData.height} cm`,
    `Weight: ${plan.userData.weight} kg`,
    `Goal: ${plan.userData.fitnessGoal}`,
    `Level: ${plan.userData.fitnessLevel}`,
  ];
  userDetails.forEach((detail) => {
    checkNewPage(8);
    doc.text(detail, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 5;

  // Workout Plan
  checkNewPage(30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Workout Plan", margin, yPosition);
  yPosition += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  plan.workoutPlan.forEach((day) => {
    checkNewPage(30);
    doc.setFont("helvetica", "bold");
    doc.text(day.day, margin, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");

    day.exercises.forEach((exercise) => {
      checkNewPage(10);
      const exerciseText = `${exercise.name}: ${exercise.sets} sets x ${exercise.reps} (Rest: ${exercise.restTime})`;
      doc.text(exerciseText, margin + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 3;
  });

  // Diet Plan
  checkNewPage(40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Diet Plan", margin, yPosition);
  yPosition += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const meals = [
    { label: "Breakfast", meal: plan.dietPlan.breakfast },
    { label: "Lunch", meal: plan.dietPlan.lunch },
    { label: "Dinner", meal: plan.dietPlan.dinner },
  ];

  meals.forEach(({ label, meal }) => {
    checkNewPage(15);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: ${meal.name}`, margin, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    if (meal.description) {
      doc.text(meal.description, margin + 5, yPosition, {
        maxWidth: pageWidth - 2 * margin - 10,
      });
      yPosition += 8;
    }
  });

  // Snacks
  if (plan.dietPlan.snacks && plan.dietPlan.snacks.length > 0) {
    checkNewPage(20);
    doc.setFont("helvetica", "bold");
    doc.text("Snacks:", margin, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    plan.dietPlan.snacks.forEach((snack) => {
      checkNewPage(10);
      doc.text(`- ${snack.name}`, margin + 5, yPosition);
      yPosition += 5;
    });
  }

  // Tips
  checkNewPage(30);
  yPosition += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Tips & Motivation", margin, yPosition);
  yPosition += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (plan.tips.tips && plan.tips.tips.length > 0) {
    plan.tips.tips.forEach((tip) => {
      checkNewPage(10);
      doc.text(`• ${tip}`, margin + 5, yPosition, {
        maxWidth: pageWidth - 2 * margin - 10,
      });
      yPosition += 6;
    });
  }

  // Save PDF
  const fileName = `fitness-plan-${plan.userData.name}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

