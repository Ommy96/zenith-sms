import { CountryIntegrationPage, type CountryConfig } from "@/components/integrations/CountryIntegrationPage";
import { ResultsImportCard } from "@/components/integrations/ResultsImportCard";

const config: CountryConfig = {
  countryCode: "TZ",
  countryName: "Tanzania",
  ministryName: "Wizara ya Elimu, Sayansi na Teknolojia",
  systemAcronym: "PREMS / NECTA",
  systemFullName: "Pre-primary Registration and Monitoring System & National Examinations Council",
  idLabel: "PREMS ID",
  idColumn: "tanzania_prems_id",
  exports: [
    { type: "tz_prems_learners", title: "PREMS learners list", description: "Wanafunzi (learners) CSV with PREMS ID and NECTA index." },
    { type: "tz_enrolment", title: "Enrolment by class & gender", description: "Wavulana / wasichana totals per darasa." },
    { type: "tz_necta_registration", title: "NECTA candidate registration", description: "PSLE / CSEE / ACSEE registration file.", needsGrade: ["VII", "F4", "F6"] },
    { type: "tz_tra_paye", title: "TRA PAYE (monthly)", description: "Tanzania Revenue Authority PAYE return.", needsMonth: true },
  ],
};

export default function TanzaniaPage() {
  return (
    <CountryIntegrationPage
      config={config}
      extra={
        <ResultsImportCard
          fn="necta-results-import"
          boardName="NECTA"
          indexLabel="NECTA index number"
          description="Upload the PSLE / CSEE / ACSEE results CSV released by NECTA and match candidates to learner records."
        />
      }
    />
  );
}