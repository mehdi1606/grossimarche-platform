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
import CurrencyServices from "@/services/CurrencyServices";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY = { code: "", name: "", symbol: "", exchangeRate: 1, enabled: true, isDefault: false };

const Currencies = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await CurrencyServices.getAllCurrency());
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
      await CurrencyServices.addCurrency({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        exchangeRate: Number(form.exchangeRate) || 1,
        enabled: form.enabled,
        isDefault: form.isDefault,
      });
      notifySuccess("Currency added.");
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
      await CurrencyServices.updateCurrency(row._id, {
        code: row.code,
        name: row.name,
        symbol: row.symbol,
        exchangeRate: Number(row.conversionRate) || 1,
        enabled: row.status === "show",
        isDefault: row.isDefault,
        ...patch,
      });
      notifySuccess("Currency updated.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const remove = async (row) => {
    try {
      await CurrencyServices.deleteCurrency(row._id);
      notifySuccess("Currency deleted.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <>
      <PageTitle>Currencies</PageTitle>

      <Card className="mb-5 bg-white dark:bg-gray-800">
        <CardBody>
          <form
            onSubmit={handleAdd}
            className="grid gap-3 md:grid-cols-6 items-end"
          >
            <Input
              placeholder="Code (MAD)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Symbol (DH)"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              required
            />
            <Input
              type="number"
              step="0.000001"
              placeholder="Rate"
              value={form.exchangeRate}
              onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
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
              Add currency
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
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Default</TableCell>
                <TableCell>Enabled</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-semibold">{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.symbol}</TableCell>
                  <TableCell>{row.conversionRate}</TableCell>
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

export default Currencies;
