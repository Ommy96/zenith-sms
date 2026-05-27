import { CountryIntegrationPage, type CountryConfig } from "@/components/integrations/CountryIntegrationPage";

const config: CountryConfig = {
  countryCode: "RW",
  countryName: "Rwanda",
  ministryName: "Minisiteri y'Uburezi (MINEDUC)",
  systemAcronym: "REB",
  systemFullName: "Rwanda Education Board",
  idLabel: "REB Student ID",
  idColumn: "rwanda_reb_id",
  language: "Kinyarwanda / French / English",
  exports: [
    { type: "rw_reb_learners", title: "REB learners list", description: "Per-learner CSV (Abanyeshuri) with REB ID and National ID." },
    { type: "rw_enrolment", title: "Enrolment by class & gender", description: "Abahungu / abakobwa totals per grade." },
    { type: "rw_national_exam_registration", title: "National examination registration", description: "P6 / S3 / S6 candidate file.", needsGrade: ["P6", "S3", "S6"] },
    { type: "rw_rra_paye", title: "RRA PAYE (monthly)", description: "Rwanda Revenue Authority PAYE return.", needsMonth: true },
  ],
};

export default function RwandaPage() { return <CountryIntegrationPage config={config} />; }