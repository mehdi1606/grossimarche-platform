import React from "react";

//internal import
import Layout from "@layout/Layout";
import useGetSetting from "@hooks/useGetSetting";
import PageHeader from "@components/header/PageHeader";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

/**
 * The terms of sale, held as one HTML block in the store settings.
 *
 * The page used to render the text and then two more skeletons fed by nothing, so it flashed
 * three blocks of grey bars on every load and settled into one. It also carried the template's
 * commented-out English sections, keyed on translation strings this project no longer has.
 */
const TermAndConditions = () => {
  const { showingTranslateValue } = useUtilsFunction();
  const { storeCustomizationSetting, loading, error } = useGetSetting();

  return (
    <Layout
      title="Conditions générales"
      description="Conditions générales de vente de Market Food"
    >
      <PageHeader
        headerBg={storeCustomizationSetting?.term_and_condition?.header_bg}
        title={showingTranslateValue(
          storeCustomizationSetting?.term_and_condition?.title
        )}
      />
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
          <CMSkeleton
            html
            count={15}
            height={15}
            error={error}
            loading={loading}
            data={storeCustomizationSetting?.term_and_condition?.description}
          />
        </div>
      </div>
    </Layout>
  );
};

export default TermAndConditions;
