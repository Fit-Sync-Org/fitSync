import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import StepName from "./onboarding/StepName";
import StepAge from "./onboarding/StepAge";
import StepGoal from "./onboarding/StepGoal";
import StepGender from "./onboarding/StepGender";
import StepOccupation from "./onboarding/StepOccupation";
import StepAvailability from "./onboarding/StepAvailability";
import StepPreference from "./onboarding/StepPreference";
import StepDiet from "./onboarding/StepDiet";
import StepMetrics from "./onboarding/StepMetrics";
import StepPhone from "./onboarding/StepPhone";
import ProgressBar from "./onboarding/ProgressBar";

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: {
      firstName: "",
      lastName: "",
    },
    age: "",
    goal: [],
    gender: "",
    occupation: "",
    availability: "",
    preference: "",
    diet: "",
    metrics: "",
    phone: "",
  });

  const steps = [
    { id: "name", required: true },
    { id: "age", required: true },
    { id: "goal", required: true },
    { id: "gender", required: true },
    { id: "occupation", required: false },
    { id: "availability", required: true },
    { id: "preference", required: false },
    { id: "diet", required: true },
    { id: "metrics", required: true },
    { id: "phone", required: false },
  ];

  const stepComponents = {
    name: StepName,
    age: StepAge,
    goal: StepGoal,
    gender: StepGender,
    occupation: StepOccupation,
    availability: StepAvailability,
    preference: StepPreference,
    diet: StepDiet,
    metrics: StepMetrics,
    phone: StepPhone,
  };

  const StepComponent = stepComponents[steps[currentStep].id];

  const updateFormData = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const isStepValid = (stepId) => {
    const value = formData[stepId];

    switch (stepId) {
      case "name":
        return value.firstName.trim() !== "" && value.lastName.trim() !== "";
      case "age":
        return value !== "" && !isNaN(value);
      case "goal":
        return Array.isArray(value) && value.length > 0;
      case "gender":
        return value !== "";
      case "availability":
        return value !== "" && !isNaN(value);
      case "diet":
        return value.trim() !== "";
      case "metrics":
        return value.height && value.weight;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const {id, required} = steps[currentStep];
    if (required && !isStepValid(id)) {alert("Please fill required fields"); return; };

    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const skipStep = () => {
    if (!steps[currentStep].required) nextStep();
  };



  const navigate = useNavigate();

  const handleSubmit = async () => {
    for (let step of steps) {
      if (step.required && !isStepValid(step.id)) {
        alert(`Please complete the ${step.id} step before submitting.`);
      return;
      }
    }

    console.log("Submitting formData:", formData);

    const resp = await fetch(
      `${import.meta.env.VITE_API_URL}/onboarding/complete`,
      { method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify({ onboardingData: formData }),
       }
    );

    if (!resp.ok) {
      console.error("Failed to mark onboarding complete");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="wizard-container">
      Complete your FitSync registration here

      <ProgressBar
        currentStep={currentStep}
        totalSteps={steps.length}
      />

      {StepComponent && (
        <StepComponent
          value={formData[steps[currentStep].id]}
          setValue={(val) => updateFormData(steps[currentStep].id, val)}
        />
      )}

      <div className="wizard-nav">
        <button onClick={prevStep} disabled={currentStep === 0}>
          Previous
        </button>
        {!steps[currentStep].required && (
          <button onClick={skipStep}>Skip</button>
        )}
        {currentStep === steps.length - 1 ? (
          <button onClick={handleSubmit}>Finish</button>
        ) : (
          <button onClick={nextStep}>Next</button>
        )}
      </div>
    </div>
  );
}
