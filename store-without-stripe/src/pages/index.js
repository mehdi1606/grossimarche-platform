import Link from "next/link";
import {
  FiArrowRight,
  FiTruck,
  FiCreditCard,
  FiTag,
  FiPackage,
  FiShoppingBag,
} from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import ProductCard from "@components/product/ProductCard";
import ProductServices from "@services/ProductServices";
import CategoryServices from "@services/CategoryServices";
import AttributeServices from "@services/AttributeServices";
import CategoryRail from "@components/category/CategoryRail";
import BundleRail from "@components/bundle/BundleRail";
import Reveal from "@components/common/Reveal";
import Hero from "@components/home/Hero";
import { safe, serverToken } from "@lib/server-token";

const VALUE_PROPS = [
  { Icon: FiTag, title: "Prix de gros", text: "Tarifs dégressifs à la quantité" },
  { Icon: FiTruck, title: "Livraison rapide", text: "Partout au Maroc" },
  { Icon: FiCreditCard, title: "Paiement à la livraison", text: "Payez en toute confiance" },
  { Icon: FiPackage, title: "Large catalogue", text: "Des milliers de références" },
];

const Home = ({ popularProducts, categories, attributes }) => {
  const cats = categories?.[0]?.children || [];
  const products = popularProducts || [];

  return (
    <Layout>
      <Hero categories={cats} />

      {/* Value props - `relative z-10` is what keeps these on top: the cards are pulled onto
          the hero with -mt-8, and the hero is positioned, so a static section here would be
          painted underneath it and lose its titles behind the green. */}
      <section className="relative z-10 mx-auto max-w-screen-2xl px-4 sm:px-10">
        <div className="-mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {VALUE_PROPS.map(({ Icon, title, text }, i) => (
            <Reveal
              key={title}
              delay={i * 90}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-5 shadow-luxe transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-luxe-lg"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-800">{title}</p>
                <p className="text-xs text-ink-500">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories - one scrollable row with arrow controls */}
      <CategoryRail categories={cats} />

      {/* Offers. Renders nothing at all when there is no active offer, so the home page has
          no empty promotional slot on a day without one. */}
      <BundleRail />

      {/* Products */}
      <section className="bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 py-20 sm:px-10">
          <Reveal className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900">Nos produits</h2>
              <p className="mt-2 text-sm text-ink-500">Sélection disponible à la commande.</p>
            </div>
            <Link
              href="/search"
              className="hidden items-center gap-1 text-sm font-medium text-emerald-700 hover:underline sm:flex"
            >
              Tout voir <FiArrowRight />
            </Link>
          </Reveal>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-cream px-6 py-20 text-center">
              <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <FiShoppingBag className="text-2xl" />
              </span>
              <h3 className="font-display text-lg font-semibold text-ink-800">Catalogue en préparation</h3>
              <p className="mt-1 max-w-sm text-sm text-ink-500">
                De nouveaux produits arrivent très bientôt. Revenez d'ici peu !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6 2xl:grid-cols-5">
              {products.map((product, i) => (
                <Reveal key={product._id} delay={Math.min(i, 8) * 60}>
                  <ProductCard product={product} attributes={attributes} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getServerSideProps = async (context) => {
  const { cookies } = context.req;
  const { query, _id } = context.query;

  // Prices are resolved from whoever is asking, and this runs on the Next server, where the
  // axios header set at sign-in does not exist. Without the token a signed-in shopper gets the
  // anonymous catalogue back: every product present, every price withheld.
  const token = await serverToken(context);

  // Guarded one by one: a backend that is restarting used to turn the whole shop into a bare
  // 500, and a failing catalogue should not also cost the categories.
  const [data, categories, attributes] = await Promise.all([
    safe(
      ProductServices.getShowingStoreProducts({
        category: _id ? _id : "",
        title: query ? query : "",
        token,
      }),
      { popularProducts: [] },
      "home products"
    ),
    safe(CategoryServices.getShowingCategory(token), [], "home categories"),
    safe(AttributeServices.getShowingAttributes(), [], "home attributes"),
  ]);

  return {
    props: {
      cookies: cookies || null,
      popularProducts: data.popularProducts || [],
      categories: categories || [],
      attributes: attributes || [],
    },
  };
};

export default Home;
