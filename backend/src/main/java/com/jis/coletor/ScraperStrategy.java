package com.jis.coletor;

import com.jis.transferencia.JobDTO;
import java.util.List;

public interface ScraperStrategy {
    List<JobDTO> scrape();
    String getSourceName();
    boolean isEnabled();
}
