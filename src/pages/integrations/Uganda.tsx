import { CountryIntegrationPage, type CountryConfig } from "@/components/integrations/CountryIntegrationPage";

const config: CountryConfig = {
  countryCode: "UG",
  countryName: "Uganda",
  ministryName: "Ministry of Education and Sports",
  systemAcronym: "EMIS / UNEB",
  systemFullName: "Education Management Information System & Uganda National Examinations Board",
  idLabel: "LIN",
  idColumn: "uganda_lin",
  exports: [
    { type: "ug_emis_learners", title: "EMIS learners list", description: "Per-learner CSV with LIN, UNEB index, demographics." },
    { type: "ug_enrolment", title: "Enrolment by class & gender", description: "Boys / girls totals per grade for MoES returns." },
    { type: "ug_uneb_registration", title: "UNEB candidate registration", description: "PLE / UCE / UACE registration file.", needsGrade: ["P7", "S4", "S6"] },
    { type: "ug_ura_paye", title: "URA PAYE (monthly)", description: "Uganda Revenue Authority PAYE return.", needsMonth: true },
  ],
};

export default function UgandaPage() { return <CountryIntegrationPage config={config} />; }