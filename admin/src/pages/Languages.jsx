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
import { FiGlobe, FiTrash2 } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import LanguageServices from "@/services/LanguageServices";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY = { name: "", isoCode: "", flag: "", enabled: true, isDefault: false };

const Languages = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await LanguageServices.getAllLanguages());
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
      await LanguageServices.addLanguage({
        name: form.name.trim(),
        isoCode: form.isoCode.trim().toLowerCase(),
        flag: form.flag.trim(),
        enabled: form.enabled,
        isDefault: form.isDefault,
      });
      notifySuccess("Language added.");
      setForm(EMPTY);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const persist = async (row, patch) => {
    try {
      await LanguageServices.updateLanguage(row._id, {
        name: row.name,
        isoCode: row.iso_code,
        flag: row.flag,
        enabled: row.status === "show",
        isDefault: row.isDefault,
        ...patch,
      });
      notifySuccess("Language updated.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const remove = async (row) => {
    try {
      await LanguageServices.deleteLanguage(row._id);
      notifySuccess("Language deleted.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <>
      <PageTitle>Languages</PageTitle>

      <Card className="mb-5 bg-white dark:bg-gray-800">
        <CardBody>
          <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-5 items-end">
            <Input
              placeholder="Name (Français)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="ISO code (fr)"
              value={form.isoCode}
              onChange={(e) => setForm({ ...form, isoCode: e.target.value })}
              required
            />
            <Input
              placeholder="Flag (emoji)"
              value={form.flag}
              onChange={(e) => setForm({ ...form, flag: e.target.value })}
            />
            <label className="flex items-center text-sm gap-2 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Default
            </label>
            <Button type="submit" disabled={saving}>
              Add language
            </Button>
          </form>
        </CardBody>
      </Card>

      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiGlobe}
          title="No languages yet"
          description="Add the languages your storefront should offer. The default one is what shoppers see first."
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Flag</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>ISO</TableCell>
                <TableCell>Default</TableCell>
                <TableCell>Enabled</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="text-xl">{row.flag}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="uppercase">{row.iso_code}</TableCell>
                  <TableCell>
                    {row.isDefault ? (
                      <Badge type="success">Default</Badge>
                    ) : (
                      <button
                        className="text-xs text-emerald-600 hover:underline"
                        onClick={() => persist(row, { isDefault: true })}
                      >
                        Set default
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge type={row.status === "show" ? "success" : "neutral"}>
                      {row.status === "show" ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!row.isDefault && (
                        <button
                          className="text-xs text-gray-600 hover:underline dark:text-gray-300"
                          onClick={() =>
                            persist(row, { enabled: row.status !== "show" })
                          }
                        >
                          {row.status === "show" ? "Disable" : "Enable"}
                        </button>
                      )}
                      {!row.isDefault && (
                        <button
                          className="text-red-500"
                          onClick={() => remove(row)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      )}
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

export default Languages;
