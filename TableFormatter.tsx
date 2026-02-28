
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TableData {
  headers: string[];
  rows: string[][];
}

interface TableFormatterProps {
  initialData?: string;
}

const TableFormatter: React.FC<TableFormatterProps> = ({ initialData = "" }) => {
  const [input, setInput] = useState<string>(initialData);
  const [tableData, setTableData] = useState<TableData | null>(null);

  useEffect(() => {
    if (initialData && initialData !== input) {
      setInput(initialData);
      if (initialData.includes('|')) {
        try {
          const data = parseTableData(initialData);
          setTableData(data);
        } catch (error) {
          console.error("Error parsing table data:", error);
        }
      }
    }
  }, [initialData]);

  const parseTableData = (text: string): TableData => {
    // Split by lines
    const lines = text.trim().split("\n");
    
    // Parse headers (first line)
    const headerLine = lines[0].trim();
    const headers = headerLine
      .split("|")
      .map(h => h.trim())
      .filter(h => h !== "");
    
    // Parse rows (remaining lines)
    const rows = lines
      .slice(1) // Skip header line
      .filter(line => line.includes("|")) // Only include lines with pipe characters
      .filter(line => !line.replace(/\|/g, "").trim().startsWith("---")) // Skip separator lines
      .map(line =>
        line
          .split("|")
          .map(cell => cell.trim())
          .filter(cell => cell !== "")
      );
    
    return { headers, rows };
  };

  const handleFormat = () => {
    if (input.trim().length === 0) return;
    
    try {
      const data = parseTableData(input);
      setTableData(data);
    } catch (error) {
      console.error("Error parsing table data:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Table Formatter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter table data in format: | Header1 | Header2 | Header3 |
| --- | --- | --- |
| Row1Cell1 | Row1Cell2 | Row1Cell3 |"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px]"
          />
          <Button onClick={handleFormat}>Format Table</Button>
        </div>
        
        {tableData && tableData.headers.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableCaption>Formatted Table</TableCaption>
              <TableHeader>
                <TableRow>
                  {tableData.headers.map((header, index) => (
                    <TableHead key={index}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableFormatter;
