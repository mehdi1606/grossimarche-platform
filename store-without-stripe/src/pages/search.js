import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FiSearch } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import useFilter from "@hooks/useFilter";
import Loading from "@components/preloader/Loading";
import ProductServices from "@services/ProductServices";
import ProductCard from "@components/product/ProductCard";
import { SidebarContext } from "@context/SidebarContext";
import AttributeServices from "@services/AttributeServices";

const Search = ({ products, attributes }) => {
  const router = useRouter();
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  const [visibleProduct, setVisibleProduct] = useState(18);

  useEffect(() => {
    setIsLoading(false);
  }, [products]);

  const { setSortedField, productData } = useFilter(products);
  const queryText = router.query?.query;

  return (
    <Layout title="Recherche" description="Parcourez le catalogue Grossimarché">
      <div className="mx-auto max-w-screen-2xl px-3 py-10 sm:px-10 lg:py-12">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-800">
              {queryText ? `Résultats pour « ${queryText} »` : "Nos produits"}
            </h1>
            {productData?.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {productData.length} produit{productData.length > 1 ? "s" : ""} trouvé
                {productData.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {productData?.length > 0 && (
            <select
              onChange={(e) => setSortedField(e.target.value)}
              className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="All" defaultValue hidden>
                Trier par prix
              </option>
              <option value="Low">Prix croissant</option>
              <option value="High">Prix décroissant</option>
            </select>
          )}
        </div>

        {isLoading ? (
          <Loading loading={isLoading} />
        ) : productData?.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-gray-100 text-gray-400">
              <FiSearch className="text-2xl" />
            </span>
            <h2 className="text-lg font-semibold text-gray-800">Aucun produit trouvé</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Essayez un autre mot-clé ou parcourez une catégorie différente.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
              {productData?.slice(0, visibleProduct).map((product, i) => (
                <ProductCard key={i + 1} product={product} attributes={attributes} />
              ))}
            </div>

            {productData?.length > visibleProduct && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setVisibleProduct((pre) => pre + 12)}
                  className="rounded-full border border-emerald-200 px-8 py-3 text-sm font-medium text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
                >
                  Voir plus
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Search;

export const getServerSideProps = async (context) => {
  const { query, _id } = context.query;

  const [data, attributes] = await Promise.all([
    ProductServices.getShowingStoreProducts({
      category: _id ? _id : "",
      title: query ? encodeURIComponent(query) : "",
    }),
    AttributeServices.getShowingAttributes({}),
  ]);

  return {
    props: {
      attributes,
      products: data?.products,
    },
  };
};
