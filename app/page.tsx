import { Graph } from "@/components/graph";
import { Table } from "@/components/table";
import { Labeling } from "@/components/labeling";
import { FuelDataProvider } from "@/contexts/FuelDataContext";

export default function Home() {
  return (
    <FuelDataProvider>
      <div className="grid col-span-5 row-span-1 bg-blue-900 p-5 mb-3 shadow-lg border-b-4 border-gray-300">
        <h1 className="text-4xl font-bold text-white">Fuel Detection Report</h1>
      </div>
      <div className="grid grid-cols-5 grid-rows-1">
        <div className="col-span-3 row-span-3 bg-blue-200">
          <Graph />
        </div>
        <div className="col-span-2 row-span-5 col-start-4 bg-blue-200">
          <Labeling />
          <Table />
        </div>
        {/* <div className="col-span-3 row-span-2 row-start-4 bg-gray-100">
         
        </div> */}
      </div>
      <div className="hidden bottom-5 right-2 p-4">
        <img src="/mena.png" alt="Operation Support Team Logo" className="w-48 h-32 mx-auto mt-5" />
      </div>
      <footer className="mt-10 p-4 text-lg text-center text-gray-500">
        &copy; 2025 Powered by Operation Support Team
      </footer>
    </FuelDataProvider>
  );
}
