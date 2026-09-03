import React from "react";
import { Select } from "@windmill/react-ui";

// Grossimarché has exactly two back-office roles. "Admin" maps to the backend ADMIN role and
// "Store Manager" to STORE_MANAGER (see services/AdminServices.js + services/adapters.js).
const SelectRole = ({ setRole, register, name, label }) => {
  return (
    <>
      <Select
        onChange={(e) => setRole && setRole(e.target.value)}
        name={name}
        {...register(`${name}`, {
          required: `${label} est obligatoire.`,
        })}
      >
        <option value="" defaultValue hidden>
          Rôle du membre
        </option>
        <option value="Admin">Administrateur</option>
        <option value="Store Manager">Responsable de magasin</option>
      </Select>
    </>
  );
};

export default SelectRole;
