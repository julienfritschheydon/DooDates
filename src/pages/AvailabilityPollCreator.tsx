import React from "react";
import { CreatePageLayout } from "@/components/layout/CreatePageLayout";
import { AvailabilityPollCreatorContent } from "./AvailabilityPollCreatorContent";

const AvailabilityPollCreator = () => {
  return (
    <CreatePageLayout>
      <AvailabilityPollCreatorContent />
    </CreatePageLayout>
  );
};

export default AvailabilityPollCreator;
