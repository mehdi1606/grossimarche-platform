import React from "react";
import { Helmet } from "react-helmet";

const PageTitle = ({ title, description }) => {
  return (
    <Helmet>
      <title>
        {" "}
        {title
          ? `${title} | React eCommerce Admin Dashboard`
          : "Market Food | Back-office"}
      </title>
      <meta
        name="description"
        content={
          description
            ? ` ${description} `
            : "Market Food : back-office du marché de gros en ligne"
        }
      />
    </Helmet>
  );
};

export default PageTitle;
