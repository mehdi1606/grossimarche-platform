import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheck,
  FiHome,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
} from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import Error from "@components/form/Error";
import InputArea from "@components/form/InputArea";
import CustomerServices from "@services/CustomerServices";
import { clientTypeIcon } from "@utils/clientTypeIcons";
import { notifyError } from "@utils/toast";

/**
 * Applying for a trade account, in two steps.
 *
 * The trade comes first, on its own screen, because it is the question that decides everything
 * else: it selects the price list, and a shop that picks the wrong one is quoted the wrong
 * prices from its first order. Buried as the second field of a long form it was answered
 * without being read - so it now gets the whole screen, as cards rather than a dropdown, where
 * the choice is a picture and a name instead of a line of text you scroll past.
 *
 * Only then does the form appear, with the choice still on screen and still changeable.
 */
const Signup = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [cityName, setCityName] = useState("");
  const [district, setDistrict] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    let cancelled = false;
    CustomerServices.getClientTypes()
      .then((res) => {
        if (cancelled) return;
        const list = res || [];
        setTypes(list);
        // Arriving from a chooser elsewhere on the site: honour it and go straight to the form
        // rather than asking the same question twice.
        const preset = list.find((t) => t.id === router.query.type);
        if (preset) setSelected(preset);
      })
      .catch(() => {
        if (!cancelled) {
          notifyError(t("auth.trade_load_failed"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router.query.type]);

  useEffect(() => {
    let cancelled = false;
    CustomerServices.getDeliveryCities()
      .then((res) => {
        if (!cancelled) setCities(res || []);
      })
      .catch(() => {
        if (!cancelled) {
          notifyError(t("auth.cities_load_failed"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentCity = cities.find((c) => c.name === cityName) || null;
  const districts = currentCity?.districts || [];

  const submitHandler = async (data) => {
    if (!cityName) {
      notifyError(t("auth.choose_city_error"));
      return;
    }
    // Only block on a missing district where the city actually has some - Benslimane has none
    // listed, and demanding one there would make the form unsubmittable.
    if (districts.length > 0 && !district) {
      notifyError(t("auth.choose_district_error"));
      return;
    }
    setLoading(true);
    try {
      await CustomerServices.register({
        fullName: data.fullName.trim(),
        businessName: data.businessName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        city: cityName,
        district: district || null,
        addressLine: data.addressLine.trim(),
        clientTypeId: selected.id,
        password: data.password,
      });
      router.push("/auth/pending");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message || t("auth.signup_failed"));
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = selected ? clientTypeIcon(selected.icon) : null;

  return (
    <Layout title={t("auth.signup_open_account")} description={t("auth.signup_meta")}>
      <div data-no-translate className="mx-auto max-w-screen-2xl px-3 py-8 sm:px-10 lg:py-14">
        {!selected ? (
          /* ---- Step 1: the trade ---- */
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-brass-50 px-3 py-1 text-2xs font-semibold uppercase tracking-luxe text-brass-600 ring-1 ring-inset ring-brass-200">
                {t("auth.step_1_of_2")}
              </span>
              <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900 lg:text-4xl">
                {t("auth.trade_question")}
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-500 md:text-base">
                {t("auth.trade_intro")}
              </p>
            </div>

            {loadingTypes ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-2xl bg-sand"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : types.length === 0 ? (
              <p className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-ink-500">
                {t("auth.trade_none")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {types.map((type) => {
                  const Icon = clientTypeIcon(type.icon);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelected(type)}
                      className="group flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-white p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-luxe focus:outline-none focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    >
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream text-emerald-700 transition duration-300 group-hover:bg-emerald-600 group-hover:text-white">
                        <Icon className="h-7 w-7" strokeWidth={1.5} />
                      </span>
                      <span className="text-sm font-semibold leading-tight text-ink-800">
                        {type.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="mt-10 text-center text-sm text-ink-500">
              {t("auth.have_account")}{" "}
              <Link href="/auth/login" className="font-semibold text-emerald-700 hover:underline">
                {t("auth.sign_in")}
              </Link>
            </p>
          </div>
        ) : (
          /* ---- Step 2: the business ---- */
          <div className="mx-auto w-full max-w-xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition hover:text-emerald-700"
            >
              <FiArrowLeft className="h-4 w-4" />
              {t("auth.change_trade")}
            </button>

            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-luxe">
              {/* The choice stays on screen: it decides the prices, so it should not become
                  invisible the moment it is made. */}
              <div className="flex items-center gap-4 border-b border-line bg-cream px-6 py-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                  <SelectedIcon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-2xs font-semibold uppercase tracking-luxe text-ink-400">
                    {t("auth.your_trade")}
                  </p>
                  <p className="truncate font-display text-lg font-semibold text-ink-900">
                    {selected.name}
                  </p>
                </div>
                <FiCheck className="ml-auto h-5 w-5 shrink-0 text-emerald-600" />
              </div>

              <div className="px-6 py-8 sm:px-10">
                <div className="mb-6">
                  <span className="text-2xs font-semibold uppercase tracking-luxe text-brass-600">
                    {t("auth.step_2_of_2")}
                  </span>
                  <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">
                    {t("auth.your_business")}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    {t("auth.business_validated")}
                  </p>
                </div>

                <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col gap-5">
                  <div>
                    <InputArea
                      register={register}
                      label={t("auth.business_name")}
                      name="businessName"
                      type="text"
                      placeholder={t("auth.business_name_placeholder")}
                      Icon={FiBriefcase}
                    />
                    <Error errorName={errors.businessName} />
                  </div>

                  <div>
                    <InputArea
                      register={register}
                      label={t("auth.your_name")}
                      name="fullName"
                      type="text"
                      placeholder={t("auth.your_name_placeholder")}
                      Icon={FiUser}
                    />
                    <Error errorName={errors.fullName} />
                  </div>

                  <div>
                    <InputArea
                      register={register}
                      label={t("auth.phone")}
                      name="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      Icon={FiPhone}
                    />
                    <Error errorName={errors.phone} />
                  </div>

                  {/* Delivery address. Asked once, here: it is what the delivery fee is
                      resolved from, so a free-typed city would be an address nobody can
                      price. */}
                  <div className="rounded-xl border border-line bg-cream/60 p-4">
                    <p className="mb-3 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-luxe text-ink-400">
                      <FiMapPin className="h-3 w-3" />
                      {t("auth.delivery_address")}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-ink-700">{t("auth.city")}</label>
                        <select
                          value={cityName}
                          onChange={(e) => {
                            setCityName(e.target.value);
                            // The districts belong to the city; keeping the old one would
                            // send a Casablanca district with a Bouznika address.
                            setDistrict("");
                          }}
                          className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="" disabled>
                            {t("auth.choose_city")}
                          </option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-ink-700">
                          {t("auth.district")}
                        </label>
                        <select
                          value={district}
                          disabled={districts.length === 0}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none disabled:bg-sand disabled:text-ink-400"
                        >
                          <option value="">
                            {cityName
                              ? districts.length
                                ? t("auth.choose_district")
                                : t("auth.no_district")
                              : t("auth.city_first")}
                          </option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <InputArea
                        register={register}
                        label={t("auth.street")}
                        name="addressLine"
                        type="text"
                        placeholder={t("auth.street_placeholder")}
                        Icon={FiHome}
                      />
                      <Error errorName={errors.addressLine} />
                      <p className="mt-1.5 text-xs text-ink-400">
                        {t("auth.address_once")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <InputArea
                      register={register}
                      label={t("auth.email")}
                      name="email"
                      type="email"
                      placeholder={t("auth.email_placeholder")}
                      Icon={FiMail}
                    />
                    <Error errorName={errors.email} />
                  </div>

                  <div>
                    <InputArea
                      register={register}
                      label={t("auth.password")}
                      name="password"
                      type="password"
                      placeholder={t("auth.password_min_placeholder")}
                      Icon={FiLock}
                    />
                    <Error errorName={errors.password} />
                    <p className="mt-1.5 text-xs text-ink-400">
                      {t("auth.password_hint")}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {loading ? t("auth.sending") : t("auth.submit_request")}
                  </button>
                </form>

                <div className="mt-8 border-t border-line pt-6 text-center">
                  <p className="text-sm text-ink-500">{t("auth.have_account")}</p>
                  <Link
                    href="/auth/login"
                    className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    {t("auth.sign_in")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Signup;
