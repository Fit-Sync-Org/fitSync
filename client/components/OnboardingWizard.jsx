import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import {auth} from "../src/firebase";

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
import "./onboarding/onbooarding-styles/OnboardingWizard.css";

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: { firstName: "", lastName: "", },
    age: "",
    goal: [],
    gender: "",
    occupation: "",
    availability: "",
    preference: "",
    diet: "",
    metrics: { height: "", weight: "" },
    phone: "",
  });

  useEffect(() => {
    const handleTooltipClick = (e) => {
      if (e.target.classList.contains("tooltip")) {
        e.preventDefault();
        e.stopPropagation();

        document.querySelectorAll(".tooltip").forEach((tooltip) => {
          tooltip.classList.remove("active");
        });

        e.target.classList.add("active");
      } else {
        document.querySelectorAll(".tooltip").forEach((tooltip) => {
          tooltip.classList.remove("active");
        });
      }
    };

    document.addEventListener("click", handleTooltipClick);
    return () => {
      document.removeEventListener("click", handleTooltipClick);
    };
  }, []);


  const steps = [
    { id: "name", required: true },
    { id: "age", required: true },
    { id: "goal", required: true },
    { id: "gender", required: true },
    { id: "occupation", required: false },
    { id: "availability", required: true },
    { id: "preference", required: false },
    { id: "diet", required: true },
    { id: "phone", required: false },
    { id: "metrics", required: true },
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
    phone: StepPhone,
    metrics: StepMetrics,
  };

  const StepComponent = stepComponents[steps[currentStep].id];

  const updateFormData = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const isStepValid = (stepId) => {
    const value = formData[stepId];

    switch (stepId) {
      case "name":
        return value.firstName && value.lastName;
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
    for (const s of steps)
      if (s.required && !isStepValid(s.id))
        return alert(`Complete the ${s.id} step first`);

    const sanitized = { ...formData, preference: formData.preference || null };

    try {
      const idToken = await auth.currentUser.getIdToken(true);
      sessionStorage.setItem("fitsyncTempToken", idToken);

        console.log("Sending Bearer token:", idToken?.slice(0, 25), "...");
      const resp = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(sanitized),
        }
      );

      if (!resp.ok) throw new Error("Server rejected onboarding");

      sessionStorage.removeItem("fitbuddyTempToken");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not complete onboarding");
    }
  };


  return (
    <div className="wizard-container">
      <p className="wizard-container-header"> Complete your FitSync registration here </p>

      <ProgressBar
        currentStep={currentStep}
        totalSteps={steps.length}
      />

      {StepComponent && (
        <StepComponent
          value={formData[steps[currentStep].id]}
          setValue={(value) => updateFormData(steps[currentStep].id, value)}
        />
      )}

      <div className="wizard-nav">
        <button className="secondary" onClick={prevStep} disabled={currentStep === 0}>
          Previous
        </button>

        <button className= {steps[currentStep].required ? "skip-disabled" : "secondary"}
                onClick={skipStep} disabled={steps[currentStep].required}>
          Skip
        </button>

        {currentStep === steps.length - 1 ? (
          <button onClick={handleSubmit}>Finish</button>
        ) : (
          <button onClick={nextStep}>Next</button>
        )}
      </div>
    </div>
  );
}
