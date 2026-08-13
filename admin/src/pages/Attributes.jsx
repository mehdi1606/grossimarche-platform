import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Select,
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
import AttributeServices from "@/services/AttributeServices";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY = { name: "", type: "OPTION", values: "" };

const Attributes = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await AttributeServices.getAllAttributes());
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AttributeServices.addAttribute({
        name: form.name.trim(),
        type: form.type,
        enabled: true,
        values: form.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => ({ name: v, enabled: true })),
      });
      notifySuccess("Attribute added.");
      setForm(EMPTY);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (row) => {
    try {
      await AttributeServices.updateAttribute(row._id, {
        name: row.title.en,
        type: row.type,
        enabled: row.status !== "show",
        values: row.variants.map((v) => ({
          name: v.name.en,
          enabled: v.status === "show",
        })),
      });
      notifySuccess("Attribute updated.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const remove = async (row) => {
    try {
      await AttributeServices.deleteAttribute(row._id);
      notifySuccess("Attribute deleted.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <>
      <PageTitle>Attributes</PageTitle>

      <Card className="mb-5 bg-white dark:bg-gray-800">
        <CardBody>
          <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-4 items-end">
            <Input
              placeholder="Name (Marque)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="OPTION">Dropdown (single)</option>
              <option value="CHECKBOX">Checkbox (multiple)</option>
            </Select>
            <Input
              placeholder="Values, comma separated"
              value={form.values}
              onChange={(e) => setForm({ ...form, values: e.target.value })}
            />
            <Button type="submit" disabled={saving}>
              Add attribute
            </Button>
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
                <TableCell>Type</TableCell>
                <TableCell>Values</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-semibold">{row.title.en}</TableCell>
                  <TableCell>{row.option}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.variants.map((v) => (
                        <span
                          key={v._id}
                          className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {v.name.en}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge type={row.status === "show" ? "success" : "neutral"}>
                      {row.status === "show" ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        className="text-xs text-gray-600 hover:underline dark:text-gray-300"
                        onClick={() => toggle(row)}
                      >
                        {row.status === "show" ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="text-red-500"
                        onClick={() => remove(row)}
                        title="Delete"
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

export default Attributes;
