import React from "react";

//internal import
import Layout from "@layout/Layout";
import useGetSetting from "@hooks/useGetSetting";
import PageHeader from "@components/header/PageHeader";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

/**
 * The privacy notice, held as one HTML block in the store settings.
 *
 * Same clean-up as the terms page: it rendered the text and then two more skeletons fed by
 * nothing, so the page flashed three blocks of grey bars before settling into one, and it
 * carried the template's commented-out English sections keyed on strings that no longer exist.
 */
const PrivacyPolicy = () => {
  const { storeCustomizationSetting, loading, error } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  return (
    <Layout
      title="Politique de confidentialité"
      description="Politique de confidentialité de Market Food"
    >
      <PageHeader
        headerBg={storeCustomizationSetting?.privacy_policy?.header_bg}
        title={showingTranslateValue(
          storeCustomizationSetting?.privacy_policy?.title
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
            data={storeCustomizationSetting?.privacy_policy?.description}
          />
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
