import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, "../../../contracts/tripify.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const tripifyProto = grpc.loadPackageDefinition(packageDefinition).tripify.v1;

const dataClient = new tripifyProto.DataService(
  `${process.env.DATA_SERVICE_HOST || "data-service"}:${
    process.env.DATA_SERVICE_PORT || 50052
  }`,
  grpc.credentials.createInsecure()
);

export default dataClient;
