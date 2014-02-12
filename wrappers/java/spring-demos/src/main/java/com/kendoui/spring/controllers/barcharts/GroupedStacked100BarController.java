package com.kendoui.spring.controllers.barcharts;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.kendoui.spring.models.ChartDataRepository;
import com.kendoui.spring.models.StockDataPoint;

@Controller("dataviz-bar_charts-grouped_stacked100_bar-controller")
@RequestMapping(value="/dataviz/bar-charts/")
public class GroupedStacked100BarController {
    @RequestMapping(value = "/grouped-stacked100-bar", method = RequestMethod.GET)
    public String index() {
        return "/dataviz/bar-charts/grouped-stacked100-bar";
    }
    
    @RequestMapping(value = "/grouped-stacked100-bar/read", method = RequestMethod.POST)
    public @ResponseBody List<StockDataPoint> read() {
        return ChartDataRepository.StockData();
    }
}
