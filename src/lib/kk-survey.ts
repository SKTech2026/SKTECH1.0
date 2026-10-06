export const CIVIL_STATUS = ["Single", "Married", "Widowed", "Divorced", "Separated", "Annulled", "Unknown", "Live-in"] as const;
export const EDUCATION = ["Elementary Level", "Elementary Graduate", "High School Level", "High School Graduate", "Vocational Graduate", "College Level", "College Graduate", "Master's Level", "Master's Graduate", "Doctorate Level", "Doctorate Graduate"] as const;
export const CLASSIFICATION = ["In-School Youth", "Out-of-School Youth", "Working Youth", "Youth with Specific Needs"] as const;
export const SPECIFIC_NEEDS = ["Person with Disability", "Children in Conflict with Law", "Indigenous People"] as const;
export const WORK_STATUS = ["Employed", "Unemployed", "Self-employed", "Currently looking for a job", "Not interested looking for a job"] as const;
export const ASSEMBLY_FREQUENCY = ["1–2 times", "3–4 times", "5 and above"] as const;
export const NO_ASSEMBLY_REASON = ["There was no KK Assembly Meeting", "Not interested to attend"] as const;

export function kkAge(birthdate: Date, today = new Date()) {
  let age = today.getUTCFullYear() - birthdate.getUTCFullYear();
  const month = today.getUTCMonth() - birthdate.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < birthdate.getUTCDate())) age--;
  return age;
}

export function ageGroup(age: number) {
  return age <= 17 ? "Child Youth 15–17 years old" : age <= 24 ? "Core Youth 18–24 years old" : "Young Adult 25–30 years old";
}
