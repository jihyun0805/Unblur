import { useState, useEffect } from "react"
import type { User } from "@/contexts/auth-context"

export interface SurveyFormData {
  dateStyle: string
  contactStyle: string
  conflictStyle: string
  spending: string
  priority: string
  agePreference: string[]
  distancePreference: string
  smokingSelf: string
  smokingPartner: string
  drinkingSelf: string
  drinkingPartner: string
  religionSelf: string
  religionPartner: string
  petSelf: string
  petPartner: string
  interests: string[]
}

const getDefaultSurveyData = (user?: User | null): SurveyFormData => ({
  dateStyle: user?.surveyData?.dateStyle || "",
  contactStyle: user?.surveyData?.contactStyle || "",
  conflictStyle: user?.surveyData?.conflictStyle || "",
  spending: user?.surveyData?.spending || "",
  priority: user?.surveyData?.priority || "",
  agePreference: user?.surveyData?.agePreference || [],
  distancePreference: user?.surveyData?.distancePreference || "",
  smokingSelf: user?.surveyData?.smokingSelf || "",
  smokingPartner: user?.surveyData?.smokingPartner || "",
  drinkingSelf: user?.surveyData?.drinkingSelf || "",
  drinkingPartner: user?.surveyData?.drinkingPartner || "",
  religionSelf: user?.surveyData?.religionSelf || "",
  religionPartner: user?.surveyData?.religionPartner || "",
  petSelf: user?.surveyData?.petSelf || "",
  petPartner: user?.surveyData?.petPartner || "",
  interests: user?.surveyData?.interests || [],
})

export function useSurveyForm(user: User | null) {
  const [surveyData, setSurveyData] = useState<SurveyFormData>(() => getDefaultSurveyData(user))

  useEffect(() => {
    setSurveyData(getDefaultSurveyData(user))
  }, [user])

  const reset = () => {
    setSurveyData(getDefaultSurveyData(user))
  }

  const updateField = <K extends keyof SurveyFormData>(field: K, value: SurveyFormData[K]) => {
    setSurveyData((prev) => ({ ...prev, [field]: value }))
  }

  const validate = (): { isValid: boolean; message?: string } => {
    if (
      !surveyData.dateStyle ||
      !surveyData.contactStyle ||
      !surveyData.conflictStyle ||
      !surveyData.spending ||
      !surveyData.priority ||
      surveyData.agePreference.length === 0 ||
      !surveyData.distancePreference ||
      !surveyData.smokingSelf ||
      !surveyData.smokingPartner ||
      !surveyData.drinkingSelf ||
      !surveyData.drinkingPartner ||
      !surveyData.religionSelf ||
      !surveyData.religionPartner ||
      !surveyData.petSelf ||
      !surveyData.petPartner ||
      surveyData.interests.length === 0
    ) {
      return {
        isValid: false,
        message: "모든 항목에 1가지 이상 응답해주세요.",
      }
    }
    return { isValid: true }
  }

  return {
    surveyData,
    setSurveyData,
    updateField,
    reset,
    validate,
  }
}
