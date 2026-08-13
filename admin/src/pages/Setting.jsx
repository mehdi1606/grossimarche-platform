import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiTrash2 } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import StoreServices from "@/services/StoreServices";
import { notifyError, notifySuccess } from "@/utils/toast";

// The admin "Settings" panel manages the physical stores / magasins (backend /admin/stores).
const EMPTY = {
  id: null,
  name: "",
  city: "",
  address: "",
  phone: "",
  lat: "",
  lng: "",
};

const Setting = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await StoreServices.getAllStores());
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => setForm(EMPTY);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim() || null,
      openingHours: {},
      lat: Number(form.lat),
      lng: Number(form.lng),
      active: true,
    };
    try {
      if (form.id) {
        await StoreServices.updateStore(form.id, body);
        notifySuccess("Store updated.");
      } else {
        await StoreServices.addStore(body);
        notifySuccess("Store added.");
      }
      resetForm();
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) =>
    setForm({
      id: row._id,
      name: row.name,
      city: row.city,
      address: row.address,
      phone: row.phone,
      lat: row.lat,
      lng: row.lng,
    });

  const remove = async (row) => {
    try {
      await StoreServices.deleteStore(row._id);
      notifySuccess("Store removed.");
      if (form.id === row._id) resetForm();
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <>
      <PageTitle>Settings — Stores</PageTitle>

      <Card className="mb-5 bg-white dark:bg-gray-800">
        <CardBody>
          <form onSubmit={handleSave} className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Store name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              className="md:col-span-3"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
            <Input
              type="number"
              step="any"
              placeholder="Latitude"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              required
            />
            <Input
              type="number"
              step="any"
              placeholder="Longitude"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {form.id ? "Update store" : "Add store"}
              </Button>
              {form.id && (
                <Button layout="outline" type="button" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {loading ? (
        <p className="text-center text-gray-500">Loading…</p>
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Name</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-semibold">{row.name}</TableCell>
                  <TableCell>{row.city}</TableCell>
                  <TableCell className="text-sm">{row.address}</TableCell>
                  <TableCell>{row.phone || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        className="text-xs text-emerald-600 hover:underline"
                        onClick={() => edit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500"
                        title="Delete"
                        onClick={() => remove(row)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan="5" className="text-center text-gray-500">
                    No stores yet. Add your first magasin above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default Setting;
