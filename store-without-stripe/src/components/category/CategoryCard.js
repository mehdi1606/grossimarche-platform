import { useRouter } from "next/router";
import { useContext, useState } from "react";
import {
  IoChevronDownOutline,
  IoChevronForwardOutline,
  IoRemoveSharp,
} from "react-icons/io5";

//internal import
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import CategoryIcon from "@components/category/CategoryIcon";

const CategoryCard = ({ title, icon, nested, id }) => {
  const router = useRouter();
  const { closeCategoryDrawer, isLoading, setIsLoading } =
    useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();

  // react hook
  const [show, setShow] = useState(false);
  const [showSubCategory, setShowSubCategory] = useState({
    id: "",
    show: false,
  });

  // handle show category
  const showCategory = (id, categoryName) => {
    const name = categoryName.toLowerCase().replace(/[^A-Z0-9]+/gi, "-");

    setShow(!show);
    router.push(`/search?category=${name}&_id=${id}`);
    closeCategoryDrawer;
    setIsLoading(!isLoading);
  };

  // handle sub nested category
  const handleSubNestedCategory = (id, categoryName) => {
    const name = categoryName.toLowerCase().replace(/[^A-Z0-9]+/gi, "-");

    setShowSubCategory({ id: id, show: showSubCategory.show ? false : true });
    router.push(`/search?category=${name}&_id=${id}`);
    closeCategoryDrawer;
    setIsLoading(!isLoading);
  };

  const handleSubCategory = (id, categoryName) => {
    const name = categoryName.toLowerCase().replace(/[^A-Z0-9]+/gi, "-");

    router.push(`/search?category=${name}&_id=${id}`);
    closeCategoryDrawer;
    setIsLoading(!isLoading);
  };

  return (
    <>
      <a
        onClick={() => showCategory(id, title)}
        className="flex min-h-[48px] w-full cursor-pointer items-center rounded-xl px-2.5 transition hover:bg-cream hover:text-emerald-700"
        role="button"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <CategoryIcon icon={icon} className="h-4 w-4" />
        </span>

        <div className="ms-3 inline-flex w-full items-center justify-between text-sm font-medium text-ink-700">
          {title}
          {nested?.length > 0 && (
            <span className="inline-flex items-center text-ink-300 transition">
              {show ? <IoChevronDownOutline /> : <IoChevronForwardOutline className="gm-dir-icon" />}
            </span>
          )}
        </div>
      </a>
      {show && nested.length > 0 && (
        <ul className="ps-6 pb-3 pt-1 -mt-1">
          {nested.map((children) => (
            <li key={children._id}>
              {children.children.length > 0 ? (
                <a
                  onClick={() =>
                    handleSubNestedCategory(
                      children._id,
                      showingTranslateValue(children.name)
                    )
                  }
                  className="flex min-h-[44px] cursor-pointer items-center pe-2 text-sm text-ink-600 transition hover:text-emerald-700"
                >
                  <span className="text-xs text-gray-500">
                    <IoRemoveSharp />
                  </span>

                  <div className="ms-3 inline-flex w-full items-center justify-between text-sm font-medium">
                    {showingTranslateValue(children.name)}

                    {children.children.length > 0 ? (
                      <span className="inline-flex items-center text-ink-300 transition">
                        {showSubCategory.id === children._id &&
                        showSubCategory.show ? (
                          <IoChevronDownOutline />
                        ) : (
                          <IoChevronForwardOutline className="gm-dir-icon" />
                        )}
                      </span>
                    ) : null}
                  </div>
                </a>
              ) : (
                <a
                  onClick={() =>
                    handleSubCategory(
                      children._id,
                      showingTranslateValue(children.name)
                    )
                  }
                  className="flex min-h-[44px] cursor-pointer items-center text-sm text-ink-600 transition hover:text-emerald-700"
                >
                  <span className="text-xs text-gray-500 pe-2">
                    <IoRemoveSharp />
                  </span>
                  {showingTranslateValue(children.name)}
                </a>
              )}

              {/* sub children category */}
              {showSubCategory.id === children._id &&
              showSubCategory.show === true ? (
                <ul className="ps-6 pb-3">
                  {children.children.map((subChildren) => (
                    <li key={subChildren._id}>
                      <a
                        onClick={() =>
                          handleSubCategory(
                            subChildren._id,
                            showingTranslateValue(subChildren?.name)
                          )
                        }
                        className="flex min-h-[44px] cursor-pointer items-center text-sm text-ink-600 transition hover:text-emerald-700"
                      >
                        <span className="text-xs text-gray-500 pe-2">
                          <IoRemoveSharp />
                        </span>
                        {showingTranslateValue(subChildren?.name)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default CategoryCard;
