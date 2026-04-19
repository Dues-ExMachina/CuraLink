const { pipeline, env } = require('@huggingface/transformers');

// Prevent warnings about multiple threads if any
env.backends.onnx.wasm.numThreads = 1;

const test = async () => {
    try {
        console.log("Loading model...");
        // Use quantized version which is a single file usually (< 2GB)
        const reranker = await pipeline('text-classification', 'onnx-community/bge-reranker-v2-m3-ONNX', { dtype: 'q4' });
        console.log("Loaded! Running inference...");
        const out = await reranker([
            { text: "What is Paris?", text_pair: "Paris is the capital of France." },
            { text: "What is Paris?", text_pair: "The quick brown fox." }
        ]);
        console.log(out);
    } catch (e) {
        console.error(e);
    }
};
test();
