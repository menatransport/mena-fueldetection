import { Graph } from "@/components/graph";
import { Table } from "@/components/table";
import { Labeling } from "@/components/labeling";
import { FuelDataProvider } from "@/contexts/FuelDataContext";

export default function Home() {
  return (
    <FuelDataProvider>
      <div className="grid col-span-5 row-span-1 bg-blue-900 p-3">
        <h1 className="text-4xl font-bold text-white">Fuel Detection Report</h1>
      </div>
      <div className="grid grid-cols-5 grid-rows-1">
        <div className="col-span-3 row-span-3 bg-red-200">
          <Graph />
        </div>
        <div className="col-span-2 row-span-5 col-start-4 bg-gray-200">
          <Labeling />
        </div>
        <div className="col-span-3 row-span-2 row-start-4 bg-gray-100">
          <Table />
        </div>
      </div>
    </FuelDataProvider>
  );
}
