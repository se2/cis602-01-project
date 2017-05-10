function [acc] = predictSVM(fea, gnd, trainNumb, opt)

% clear
clc
close all

%% Global variables
% 
% load dataset
trainFea = fea(1:trainNumb,:);
trainLabel = gnd(1:trainNumb,:);

testFea = fea(trainNumb + 1:380,:);
testLabel = gnd(trainNumb + 1:380,:);

[nFea, n] = size(trainFea);

fold = ' -v 5 ';
% slack C
C = [5, 10, 15, 20];
% gamma
gamma = [1/nFea, 0.01, 0.1, 1, 10];
% 

if(strcmpi(opt, 'lin'))
%% Linear kernel
options = '-t 0 -c ';
model = zeros(4);

for i=C
    subOptions = [options, num2str(i), fold];
    model(i,:) = svmtrain(trainLabel, trainFea, subOptions);
    clear subOptions;
end

% get highest accuracy
[maxValue, maxIndex] = max(model);
options = [options, num2str(maxIndex), fold];

% construct linear model 
linearModel = svmtrain(trainLabel, trainFea, options);
% predict using LIBSVM
[predictLabel] = svmpredict(testLabel, testFea, linearModel);


end

if(strcmpi(opt, 'poly'))
%% Polynomial kernel
options = '-t 1';
degree = [3, 4, 5, 6];
model = [];
for i=gamma
    subGamma = [' -g ', num2str(i)];
    subGammaOptions = [options, fold, subGamma];
    for j=degree
        subDegree = [' -d ', num2str(j)];
        subDegreeOptions = [subGammaOptions, subDegree];
        subModel = svmtrain(trainLabel, trainFea, subDegreeOptions);
        model = [model, vertcat(subModel, i, j)];
    end
end
[maxValue, maxIndex] = max(model(1,:));
options = [options, ' -g ', num2str(model(2,maxIndex)), ' -d ', num2str(model(3,maxIndex))];

% construct polynomial model 
polynomialModel = svmtrain(trainLabel, trainFea, options);
% predict using LIBSVM
[predictLabel] = svmpredict(testLabel, testFea, polynomialModel);


end

if(strcmpi(opt, 'gau'))
%% Gaussion kernel
options = '-t 2';
model = [];
for i=gamma
    subGamma = [' -g ', num2str(i)];
    subGammaOptions = [options, fold, subGamma];
    for j=C
        subC = [' -c ', num2str(j)];
        subDegreeOptions = [subGammaOptions, subC];
        subModel = svmtrain(trainLabel, trainFea, subDegreeOptions);
        model = [model, vertcat(subModel, i, j)];
    end
end
[maxValue, maxIndex] = max(model(1,:));
options = [options, ' -g ', num2str(model(2,maxIndex)), ' -c ', num2str(model(3,maxIndex))];

% construct Gaussian model 
gaussionModel = svmtrain(trainLabel, trainFea, options);
% predict using LIBSVM
[predictLabel] = svmpredict(testLabel, testFea, gaussionModel);
%
end

acc = sum(predictLabel == testLabel) / length(testLabel);



