import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import {auth} from "../../src/firebase";
import { generateAndSavePlan } from "../../src/utils/planGeneration";

import StepName from "./StepName";
import StepAge from "./StepAge";
import StepGoal from "./StepGoal";
import StepGender from "./StepGender";
import StepOccupation from "./StepOccupation";
import StepAvailability from "./StepAvailability";
import StepPreference from "./StepPreference";
import StepDiet from "./StepDiet";
import StepMetrics from "./StepMetrics";
import StepPhone from "./StepPhone";
import ProgressBar from "./ProgressBar";
import "./onbooarding-styles/OnboardingWizard.css";

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
      const tooltip = e.target.closest(".tooltip");

      const tooltips = document.querySelectorAll(".tooltip");
      tooltips.forEach((el) => el.classList.remove("active"));

      if (tooltip) {
        e.preventDefault();
        e.stopPropagation();
        tooltip.classList.add("active");
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
    { id: "preference", required: true },
    { id: "diet", required: false },
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

      const registrationResult = await resp.json();
      console.log("Registration completed successfully:", registrationResult);

      const userResp = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        credentials: 'include'
      });

      if (userResp.ok) {
        const userProfile = await userResp.json();
        console.log("Starting AI plan generation for new user...");

        const planResult = await generateAndSavePlan(userProfile);

        if (planResult.success) {
          console.log("Plan generated successfully:", planResult);
          alert("Welcome to FitSync! Your personalized plan has been generated and is ready to use.");
        } else {
          console.error("Plan generation failed:", planResult.error);
          alert("Registration completed, but plan generation failed. You can generate a plan later from the My Plans section.");
        }
      } else {
        console.error("Failed to fetch user profile for plan generation");
        alert("Registration completed, but couldn't generate your initial plan. You can generate one later from the Plans section.");
      }

      sessionStorage.removeItem("fitsyncTempToken");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not complete onboarding");
    }
  };


  return (
    <div className="wizard-wrapper">
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
    </div>
  );
}
