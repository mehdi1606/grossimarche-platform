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
import { useTranslation } from "react-i18next";
import { FiTrash2 } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import CategoryServices from "@/services/CategoryServices";
import { notifyError, notifySuccess } from "@/utils/toast";

// Grossimarché categories are flat (name, slug, icon, order, active). This is a simple,
// fully backend-driven management page — no nested sub-categories.
const EMPTY = { id: null, name: "", slug: "", icon: "", displayOrder: 0 };

const Category = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await CategoryServices.getAllCategory());
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
      slug: form.slug.trim(),
      icon: form.icon.trim(),
      displayOrder: Number(form.displayOrder) || 0,
      status: "show",
    };
    try {
      if (form.id) {
        await CategoryServices.updateCategory(form.id, body);
        notifySuccess("Category updated.");
      } else {
        await CategoryServices.addCategory(body);
        notifySuccess("Category added.");
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
      name: row.name?.en || "",
      slug: row.slug || "",
      icon: row.icon || "",
      displayOrder: row.displayOrder ?? 0,
    });

  const toggle = async (row) => {
    try {
      await CategoryServices.updateStatus(row._id, {
        status: row.status === "show" ? "hide" : "show",
      });
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const remove = async (row) => {
    try {
      await CategoryServices.deleteCategory(row._id);
      notifySuccess("Category deactivated.");
      if (form.id === row._id) resetForm();
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <>
      <PageTitle>{t("Category")}</PageTitle>

      <Card className="mb-5 bg-white dark:bg-gray-800">
        <CardBody>
          <form onSubmit={handleSave} className="grid gap-3 md:grid-cols-5 items-end">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Slug (optional)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <Input
              placeholder="Icon (emoji)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Order"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {form.id ? "Update" : "Add"}
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
                <TableCell>Icon</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="text-xl">{row.icon}</TableCell>
                  <TableCell className="font-semibold">{row.name?.en}</TableCell>
                  <TableCell className="text-sm text-gray-500">{row.slug}</TableCell>
                  <TableCell>{row.productCount}</TableCell>
                  <TableCell>
                    <Badge type={row.status === "show" ? "success" : "neutral"}>
                      {row.status === "show" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        className="text-xs text-emerald-600 hover:underline"
                        onClick={() => edit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs text-gray-600 hover:underline dark:text-gray-300"
                        onClick={() => toggle(row)}
                      >
                        {row.status === "show" ? "Disable" : "Enable"}
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
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default Category;
