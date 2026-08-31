import pytest
from backend.rag.retriever import retriever
from backend.rag.static_protocol import get_static_protocol_advisory, STATIC_PROTOCOL_TABLE

def test_rag_retrieval_oisd():
    chunks, conf = retriever.query("OISD-STD-105 H2S work permit hot work", top_k=2)
    assert len(chunks) > 0
    assert conf > 0.0
    assert any("105" in c["doc_name"] or "105" in c["title"] for c in chunks)

def test_rag_retrieval_respirator_fit():
    chunks, conf = retriever.query("respirator cartridge replacement fit test OISD-STD-155", top_k=2)
    assert len(chunks) > 0
    assert any("155" in c["doc_name"] or "155" in c["title"] or "cartridge" in c["content"].lower() for c in chunks)

def test_static_protocol_fallback():
    adv = get_static_protocol_advisory(
        tier="TIER 2 (CAUTION)",
        worker_id="EMP-1042",
        twa_ppm=2.4,
        rolling_7day_load=18.0
    )
    assert adv.severity_tier == "TIER 2 (CAUTION)"
    assert adv.rag_retrieval_mode == "STATIC_PROTOCOL_FALLBACK"
    assert len(adv.recommendations) > 0
    assert adv.bilingual_content is not None
    assert len(adv.bilingual_content.summary_banner_hi) > 0
