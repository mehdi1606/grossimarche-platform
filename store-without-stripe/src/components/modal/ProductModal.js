import Image from "next/image";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

//internal import
import Price from "@components/common/Price";
import Stock from "@components/common/Stock";
import Tags from "@components/common/Tags";
import { notifyError } from "@utils/toast";
import useAddToCart from "@hooks/useAddToCart";
import MainModal from "@components/modal/MainModal";
import Discount from "@components/common/Discount";
import ProductImage from "@components/product/ProductImage";
import PriceTiers from "@components/product/PriceTiers";
import VariantList from "@components/variants/VariantList";
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { handleLogEvent } from "src/lib/analytics";

const ProductModal = ({
  modalOpen,
  setModalOpen,
  product,
  attributes,
  currency,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { setIsLoading, isLoading } = useContext(SidebarContext);

  const { handleAddItem, setItem, item, minOf } = useAddToCart();

  // Same wholesale minimum as the product page - the modal is a full add-to-cart surface,
  // not a preview, so it has to honour the same rule.
  const minQuantity = minOf(product);
  const { lang, showingTranslateValue, getNumber, getNumberTwo } =
    useUtilsFunction();

  // react hook
  const [value, setValue] = useState("");
  const [price, setPrice] = useState(0);
  const [img, setImg] = useState("");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectVariant, setSelectVariant] = useState({});
  const [selectVa, setSelectVa] = useState({});
  const [variantTitle, setVariantTitle] = useState([]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    // console.log('value', value, product);
    if (value) {
      const result = product?.variants?.filter((variant) =>
        Object.keys(selectVa).every((k) => selectVa[k] === variant[k])
      );

      const res = result?.map(
        ({
          originalPrice,
          price,
          discount,
          quantity,
          barcode,
          sku,
          productId,
          image,
          ...rest
        }) => ({
          ...rest,
        })
      );

      const filterKey = Object.keys(Object.assign({}, ...res));
      const selectVar = filterKey?.reduce(
        (obj, key) => ({ ...obj, [key]: selectVariant[key] }),
        {}
      );
      const newObj = Object.entries(selectVar).reduce(
        (a, [k, v]) => (v ? ((a[k] = v), a) : a),
        {}
      );

      const result2 = result?.find((v) =>
        Object.keys(newObj).every((k) => newObj[k] === v[k])
      );

      // console.log("result2", result2);

      if (result.length <= 0 || result2 === undefined) return setStock(0);

      setVariants(result);
      setSelectVariant(result2);
      setSelectVa(result2);
      setImg(result2?.image);
      setStock(result2?.quantity);
      const price = getNumber(result2?.price);
      const originalPrice = getNumber(result2?.originalPrice);
      const discountPercentage = getNumber(
        ((originalPrice - price) / originalPrice) * 100
      );
      setDiscount(getNumber(discountPercentage));
      setPrice(price);
      setOriginalPrice(originalPrice);
    } else if (product?.variants?.length > 0) {
      const result = product?.variants?.filter((variant) =>
        Object.keys(selectVa).every((k) => selectVa[k] === variant[k])
      );

      setVariants(result);
      setStock(product.variants[0]?.quantity);
      setSelectVariant(product.variants[0]);
      setSelectVa(product.variants[0]);
      setImg(product.variants[0]?.image);
      const price = getNumber(product.variants[0]?.price);
      const originalPrice = getNumber(product.variants[0]?.originalPrice);
      const discountPercentage = getNumber(
        ((originalPrice - price) / originalPrice) * 100
      );
      setDiscount(getNumber(discountPercentage));
      setPrice(price);
      setOriginalPrice(originalPrice);
    } else {
      setStock(product?.stock);
      setImg(product?.image[0]);
      const price = getNumber(product?.prices?.price);
      const originalPrice = getNumber(product?.prices?.originalPrice);
      const discountPercentage = getNumber(
        ((originalPrice - price) / originalPrice) * 100
      );
      setDiscount(getNumber(discountPercentage));
      setPrice(price);
      setOriginalPrice(originalPrice);
    }
  }, [
    product?.prices?.discount,
    product?.prices?.originalPrice,
    product?.prices?.price,
    product?.stock,
    product.variants,
    selectVa,
    selectVariant,
    value,
  ]);
  // console.log("product", product);

  useEffect(() => {
    const res = Object.keys(Object.assign({}, ...product?.variants));

    const varTitle = attributes?.filter((att) => res.includes(att?._id));

    setVariantTitle(varTitle?.sort());
  }, [variants, attributes]);

  // Open the stepper on the minimum order quantity, so the number shown is the number that
  // will actually be added.
  useEffect(() => {
    setItem(minQuantity);
  }, [minQuantity, setItem]);

  const handleAddToCart = (p) => {
    if (p.variants.length === 1 && p.variants[0].quantity < 1)
      return notifyError(t("product.err_stock"));

    if (stock <= 0) return notifyError(t("product.err_out_of_stock"));
    if (stock < minQuantity)
      return notifyError(
        t("product.min_order_stock", { count: minQuantity })
      );

    if (
      product?.variants.map(
        (variant) =>
          Object.entries(variant).sort().toString() ===
          Object.entries(selectVariant).sort().toString()
      )
    ) {
      const { variants, categories, description, ...updatedProduct } = product;
      const newItem = {
        ...updatedProduct,
        id: `${
          p?.variants.length <= 0
            ? p._id
            : p._id +
              "-" +
              variantTitle?.map((att) => selectVariant[att._id]).join("-")
        }`,
        title: `${
          p?.variants.length <= 0
            ? showingTranslateValue(p.title)
            : showingTranslateValue(p.title) +
              "-" +
              variantTitle
                ?.map((att) =>
                  att.variants?.find((v) => v._id === selectVariant[att._id])
                )
                .map((el) => showingTranslateValue(el?.name))
        }`,
        image: img,
        variant: selectVariant || {},
        price:
          p.variants.length === 0
            ? getNumber(p.prices.price)
            : getNumber(price),
        originalPrice:
          p.variants.length === 0
            ? getNumber(p.prices.originalPrice)
            : getNumber(originalPrice),
      };

      // console.log("newItem", newItem);

      handleAddItem(newItem);
    } else {
      return notifyError(t("product.err_options"));
    }
  };

  const handleMoreInfo = (slug) => {
    setModalOpen(false);

    router.push(`/product/${slug}`);
    setIsLoading(!isLoading);
    handleLogEvent("product", `opened ${slug} product details`);
  };

  const category_name = showingTranslateValue(product?.category?.name)
    ?.toLowerCase()
    ?.replace(/[^A-Z0-9]+/gi, "-");

  // console.log("product", product, "stock", stock);

  return (
    <>
      <MainModal modalOpen={modalOpen} setModalOpen={setModalOpen}>
        <div className="inline-block overflow-y-auto h-full align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex flex-col lg:flex-row md:flex-row w-full max-w-4xl overflow-hidden">
            <Link href={`/product/${product.slug}`} passHref>
              <div
                onClick={() => setModalOpen(false)}
                className="flex-shrink-0 flex items-center justify-center h-auto cursor-pointer"
              >
                <Discount product={product} discount={discount} modal />
                <ProductImage
                  src={img || product.image?.[0]}
                  alt={showingTranslateValue(product?.title)}
                  unit={product?.unit}
                  zoom={false}
                  className="aspect-square w-full sm:w-[380px]"
                />
              </div>
            </Link>

            <div className="w-full flex flex-col p-5 md:p-8 text-start">
              <div className="mb-2 md:mb-2.5 block -mt-1.5">
                <Link href={`/product/${product.slug}`} passHref>
                  <h1
                    onClick={() => setModalOpen(false)}
                    className="text-heading text-lg md:text-xl lg:text-2xl font-semibold font-serif hover:text-black cursor-pointer"
                  >
                    {showingTranslateValue(product?.title)}
                  </h1>
                </Link>
                <div
                  className={`${
                    stock <= 0 ? "relative py-1 mb-2" : "relative"
                  }`}
                >
                  <Stock stock={stock} />
                </div>
              </div>
              <p className="text-sm leading-6 text-gray-500 md:leading-6">
                {showingTranslateValue(product?.description)}
              </p>
              <div className="flex items-center my-4">
                <Price
                  product={product}
                  price={price}
                  currency={currency}
                  originalPrice={originalPrice}
                />
              </div>

              <div className="mb-1">
                {variantTitle?.map((a, i) => (
                  <span key={a._id}>
                    <h4 className="text-sm py-1 font-serif text-gray-700 font-bold">
                      {showingTranslateValue(a?.name)}:
                    </h4>
                    <div className="flex flex-row mb-3">
                      <VariantList
                        att={a._id}
                        lang={lang}
                        option={a.option}
                        setValue={setValue}
                        varTitle={variantTitle}
                        variants={product?.variants}
                        setSelectVa={setSelectVa}
                        selectVariant={selectVariant}
                        setSelectVariant={setSelectVariant}
                      />
                    </div>
                  </span>
                ))}
              </div>

              {product?.priceTiers?.length > 0 && (
                <div className="mt-4">
                  <PriceTiers
                    product={product}
                    basePrice={product?.prices?.price}
                    quantity={item}
                    compact
                  />
                </div>
              )}

              {minQuantity > 1 && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sand px-3 py-2 text-xs font-medium text-ink-600">
                  {t("product.min_order", { count: minQuantity, unit: product.unit || "u." })}
                </p>
              )}

              <div className="flex items-center mt-4">
                <div className="flex items-center justify-between space-s-3 sm:space-s-4 w-full">
                  <div className="group flex h-11 flex-shrink-0 items-center justify-between overflow-hidden rounded-xl border border-line md:h-12">
                    <button
                      onClick={() => setItem(Math.max(minQuantity, item - 1))}
                      disabled={item <= minQuantity}
                      className="flex items-center justify-center flex-shrink-0 h-full transition ease-in-out duration-300 focus:outline-none w-8 md:w-12 text-heading border-e border-gray-300 hover:text-gray-500"
                    >
                      <span className="text-dark text-base">
                        <FiMinus />
                      </span>
                    </button>
                    <p className="font-semibold flex items-center justify-center h-full  transition-colors duration-250 ease-in-out cursor-default flex-shrink-0 text-base text-heading w-8  md:w-20 xl:w-24">
                      {item}
                    </p>
                    <button
                      onClick={() => setItem(item + 1)}
                      disabled={
                        product.quantity < item || product.quantity === item
                      }
                      className="flex items-center justify-center h-full flex-shrink-0 transition ease-in-out duration-300 focus:outline-none w-8 md:w-12 text-heading border-s border-gray-300 hover:text-gray-500"
                    >
                      <span className="text-dark text-base">
                        <FiPlus />
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.quantity < 1}
                    className="ms-4 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border-0 border-transparent bg-emerald-600 px-4 py-4 text-center text-sm font-semibold leading-4 text-white shadow-luxe transition duration-300 ease-in-out hover:bg-emerald-700 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:px-6 md:py-3.5 lg:px-8 lg:py-4"
                  >
                    {t("product.add_to_cart")}
                  </button>
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className="flex items-center justify-between space-s-3 sm:space-s-4 w-full">
                  <div>
                    {product?.category?._id && (
                      <span className="d-block py-1 text-sm font-semibold">
                        <span className="text-ink-600">{t("product.category")}</span>{" "}
                        <Link
                          href={`/search?category=${category_name}&_id=${product?.category?._id}`}
                        >
                          <button
                            type="button"
                            className="ms-1 font-medium text-emerald-700 underline transition hover:text-emerald-800"
                            onClick={() => setIsLoading(!isLoading)}
                          >
                            {category_name}
                          </button>
                        </Link>
                      </span>
                    )}

                    <Tags product={product} />
                  </div>

                  <div>
                    <button
                      onClick={() => handleMoreInfo(product.slug)}
                      className="font-sans font-medium text-sm text-orange-500"
                    >
                      {t("product.view_product")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainModal>
    </>
  );
};

export default ProductModal;
