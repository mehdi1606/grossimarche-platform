import React from "react";
import { Helmet } from "react-helmet";

const PageTitle = ({ title, description }) => {
  return (
    <Helmet>
      <title>
        {" "}
        {title
          ? `${title} | React eCommerce Admin Dashboard`
          : "Grossimarché | Back-office"}
      </title>
      <meta
        name="description"
        content={
          description
            ? ` ${description} `
            : "Grossimarché : back-office du marché de gros en ligne"
        }
      />
    </Helmet>
  );
};

export default PageTitle;
