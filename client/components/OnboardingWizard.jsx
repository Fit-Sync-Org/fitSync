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
    name: "",
    age: "",
    goal: "",
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

  const updateFormData = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const nextStep = () => {
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
    console.log("Submitting formData:", formData);
    const resp = await fetch(
      `${import.meta.env.VITE_API_URL}/auth/complete-onboarding`,
      { method: "POST", credentials: "include" }
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

      {currentStep === 0 && (
        <StepName
          value={formData.name}
          setValue={(val) => updateFormData("name", val)}
        />
      )}
      {currentStep === 1 && (
        <StepAge
          value={formData.age}
          setValue={(val) => updateFormData("age", val)}
        />
      )}
      {currentStep === 2 && (
        <StepGoal
          value={formData.goal}
          setValue={(val) => updateFormData("goal", val)}
        />
      )}
      {currentStep === 3 && (
        <StepGender
          value={formData.gender}
          setValue={(val) => updateFormData("gender", val)}
        />
      )}
      {currentStep === 4 && (
        <StepOccupation
          value={formData.occupation}
          setValue={(val) => updateFormData("occupation", val)}
        />
      )}
      {currentStep === 5 && (
        <StepAvailability
          value={formData.availability}
          setValue={(val) => updateFormData("availability", val)}
        />
      )}
      {currentStep === 6 && (
        <StepPreference
          value={formData.preference}
          setValue={(val) => updateFormData("preference", val)}
        />
      )}
      {currentStep === 7 && (
        <StepDiet
          value={formData.diet}
          setValue={(val) => updateFormData("diet", val)}
        />
      )}
      {currentStep === 8 && (
        <StepMetrics
          value={formData.metrics}
          setValue={(val) => updateFormData("metrics", val)}
        />
      )}
      {currentStep === 9 && (
        <StepPhone
          value={formData.phone}
          setValue={(val) => updateFormData("phone", val)}
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
